// src/app/modules/subscription/subscription.service.ts
/** biome-ignore-all lint/suspicious/noExplicitAny: > */
/** biome-ignore-all lint/style/useTemplate: > */
/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/style/useImportType: > */

import { PaymentStatus, SubscriptionPlan } from "@prisma/client";
// biome-ignore lint/style/useNodejsImportProtocol: >
import crypto from "crypto";
import { prisma } from "../../configs/db.config";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { envVars } from "../../configs/envVars";
import { PLANS } from "./plan.config";
import { toJsonValue } from "../../helper/jasonValueConvertar";
import axios from "axios";
import { universalQueryBuilder } from "../../shared/universalQueryBuilder";

/**
 * STEP 1 — Create subscription & initiate payment
 */
const createSubscription = async (userId: string, plan: any) => {
  const explorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  const planCfg = PLANS[plan.plan as SubscriptionPlan];

  if (!planCfg || plan === SubscriptionPlan.FREE) {
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid plan");
  }

  const transactionId = crypto.randomUUID();
  const amount = planCfg.priceBDT;

  const newPaymentPayload = {
    explorerId: explorer.id,
    planName: plan.plan,
    amount,
    gateway: "SSLCOMMERZ",
    transactionId,
    status: PaymentStatus.PENDING,
    rawResponse: toJsonValue({ createdAt: new Date().toISOString() }),
  };

  //  TRANSACTION: create ONE payment only
  const payment = await prisma.$transaction(async (tx) => {
    return await tx.payment.create({
      data: newPaymentPayload,
    });
  });

  // Call gateway OUTSIDE transaction
  const gatewayResponse = await initiatePayment(payment, explorer);
  console.log({ gatewayResponse });

  return {
    paymentId: payment.id,
    paymentUrl: gatewayResponse.GatewayPageURL,
  };
};

//  "paymentId": "f0cf32d0-cefe-434c-a200-f7a9bdf5bc7b",
//     "paymentUrl": "https://sandbox.sslcommerz.com/gwprocess/v3/gw.php?Q=PAY&SESSIONKEY=37D1262B26F90D091A36D80C98B1B5D5"

const initiatePayment = async (payment: any, explorer: any) => {
  const user = await prisma.user.findFirst({
    where: { id: explorer.userId },
  });

  if (!user) {
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }

  /**
   * IMPORTANT:
   * Always attach tran_id to redirect URLs
   */
  const frontendBaseUrl = envVars.FRONEND_URL;

  const successUrl = `${frontendBaseUrl}/payment/success?tran_id=${payment.transactionId}`;
  const failUrl = `${frontendBaseUrl}/payment/failed?tran_id=${payment.transactionId}`;
  const cancelUrl = `${frontendBaseUrl}/payment/cancel?tran_id=${payment.transactionId}`;
  // const successUrl = `${frontendBaseUrl}/payment/success`;
  // const failUrl = `${frontendBaseUrl}/payment/failed`;
  // const cancelUrl = `${frontendBaseUrl}/payment/cancel`;

  const payload = {
    store_id: envVars.SSL.SSL_STORE_ID,
    store_passwd: envVars.SSL.SSL_SECRET_KEY,
    total_amount: payment.amount,
    currency: "BDT",
    tran_id: payment.transactionId,

    success_url: successUrl,
    fail_url: failUrl,
    cancel_url: cancelUrl,
    ipn_url: envVars.SSL.SSL_IPN_URL,

    cus_name: explorer.fullName,
    cus_email: user.email,

    shipping_method: "N/A",
    product_name: "Companion",
    product_category: "Service",
    product_profile: "general",

    cus_add1: explorer.address ?? "N/A",
    cus_add2: "N/A",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: explorer.phone ?? "N/A",
    cus_fax: "01711111111",

    ship_name: "N/A",
    ship_add1: "N/A",
    ship_add2: "N/A",
    ship_city: "N/A",
    ship_state: "N/A",
    ship_postcode: "1000",
    ship_country: "Bangladesh",
  };

  try {
    const response = await axios.post(envVars.SSL.SSL_PAYMENT_API, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data;
  } catch (error: any) {
    if (envVars.NODE_ENV === "Development") {
      console.error(
        "SSLCommerz initiation failed:",
        error?.response?.data || error
      );
    }

    throw new customError(
      StatusCodes.BAD_GATEWAY,
      "Failed to initiate payment with SSLCommerz"
    );
  }
};


const verifyAndFinalizePayment = async (payload: any) => {
  console.log("SSL hit for verifying payment");

  console.log({
    payload,
    "envVars.SSL.SSL_SECRET_KEY": envVars.SSL.SSL_SECRET_KEY,
  });

  const tranId = payload.tran_id || payload.val_id;

  if (!tranId) {
    throw new customError(StatusCodes.BAD_REQUEST, "Missing transaction id");
  }

  const payment = await prisma.payment.findUnique({
    where: { transactionId: tranId },
  });

  if (!payment) {
    throw new customError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  const explorer = await prisma.explorer.findFirst({
    where: {
      id: payment.explorerId,
    },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  // Prevent double processing
  if (payment.status === PaymentStatus.PAID) {
    return { alreadyProcessed: true };
  }

  if (Number(payload.amount) !== Number(payment.amount)) {
    throw new customError(StatusCodes.BAD_REQUEST, "Amount mismatch");
  }

  if (!["VALID", "SUCCESS", "COMPLETED"].includes(payload.status)) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        rawResponse: toJsonValue(payload),
      },
    });
    return { failed: true };
  }

  const planCfg = PLANS[payment.planName];
  const startDate = new Date();
  const endDate = new Date(
    startDate.getTime() + planCfg.durationDays * 86400000
  );

 

  const subs = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        rawResponse: toJsonValue(payload),
      },
    });

    await tx.explorer.update({
      where: { id: explorer.id },
      data: { isPremium: true },
    });

    return await tx.subscription.create({
      data: {
        explorerId: explorer.id,
        planName: payment.planName,
        startDate,
        endDate,
        paymentId: payment.id,
        isActive: true,
      },
    });
  });

  console.log({ subs });

  return { success: true, subs };
};

/**
 * handleSslCommerzCallback - alias for verifyAndFinalizePayment maintained for compatibility
 */
const handleSslCommerzCallback = verifyAndFinalizePayment;

const getAllSubscription = async (query: Record<string, string>) => {
  const builtQuery = universalQueryBuilder("subscription", query);


  const [data, total] = await prisma.$transaction([
    prisma.subscription.findMany({
      where: builtQuery.where,
      include: {
        explorer: true,
        payment: true,
      },
      orderBy: builtQuery.orderBy,
      skip: builtQuery.skip,
      take: builtQuery.take,
    }),
    prisma.subscription.count({ where: builtQuery.where, }),
  ]);

  return {
    data,
    meta: {
      ...builtQuery.meta,
      total,
    },
  };
};

const getSingleSubscription = async (id: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { explorer: true },
  });

  if (!subscription)
    throw new customError(StatusCodes.NOT_FOUND, "Subscription not found");

  return subscription;
};

const getMySubscription = async (userId: string) => {
  console.log("Getting my subscription");

  const explorer = await prisma.explorer.findFirst({
    where: { userId },
    include: { subscription: true },
  });
  console.log({ explorer });

  if (!explorer)
    throw new customError(StatusCodes.NOT_FOUND, "Explorer profile not found");
  console.log({ subscriptionId: explorer?.subscription?.id });

  const subscripiion = await prisma.subscription.findUnique({
    where: {
      id: explorer?.subscription?.id,
      isActive: true,
    },
  });
  console.log({ subscripiion });

  if (!subscripiion)
    throw new customError(
      StatusCodes.NOT_FOUND,
      "Subscripiion profile not found"
    );

  return subscripiion;
};

export const subscriptionService = {
  verifyAndFinalizePayment,
  createSubscription,
  handleSslCommerzCallback,
  getMySubscription,
  getSingleSubscription,
  getAllSubscription,
};
