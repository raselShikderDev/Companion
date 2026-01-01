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
import { prismaQueryBuilder } from "../../shared/queryBuilder";
import axios from "axios";

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
    where: {
      id: explorer?.userId,
    },
  });
  if (!user) {
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }
  const data = {
    store_id: envVars.SSL.SSL_STORE_ID,
    store_passwd: envVars.SSL.SSL_SECRET_KEY,
    total_amount: payment.amount,
    currency: "BDT",
    tran_id: payment.transactionId,
    success_url: envVars.SSL.SSL_SUCCESS_FRONTEND_URL,
    fail_url: envVars.SSL.SSL_FAIL_FRONTEND_URL,
    cancel_url: envVars.SSL.SSL_CANCEL_FRONTEND_URL,
    ipn_url: envVars.SSL.SSL_IPN_URL,
    cus_name: explorer.fullName,
    cus_email: user.email,
    shipping_method: "N/A",
    product_name: "Companion",
    product_category: "Service",
    product_profile: "general",
    cus_add1: explorer.address,
    cus_add2: "N/A",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: explorer.phone,
    cus_fax: "01711111111",
    ship_name: "N/A",
    ship_add1: "N/A",
    ship_add2: "N/A",
    ship_city: "N/A",
    ship_state: "N/A",
    ship_postcode: 1000,
    ship_country: "N/A",
  };



  try {
    const response = await axios({
      method: "POST",
      url: envVars.SSL.SSL_PAYMENT_API,
      data,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const resData = response.data;

    //  resData: {
    //     status: 'SUCCESS',
    //     failedreason: '',
    //     sessionkey: '72110146191078463D7FA938FDA9EC81',
    //     gw: {
    //       visa: 'city_visa,ebl_visa,visacard',
    //       master: 'city_master,ebl_master,mastercard',
    //       amex: 'city_amex,amexcard',
    //       othercards: 'qcash,fastcash',
    //       internetbanking: 'city,bankasia,ibbl,mtbl',
    //       mobilebanking: 'dbblmobilebanking,bkash,abbank,ibbl'
    //     },
    //     redirectGatewayURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/bankgw/indexhtml.php?mamount=499.00&ssl_id=251223203600rvFUfBeDrvKCpIc&Q=REDIRECT&SESSIONKEY=72110146191078463D7FA938FDA9EC81&tran_type=success&cardname=',
    //     directPaymentURLBank: '',
    //     directPaymentURLCard: '',
    //     directPaymentURL: '',
    //     redirectGatewayURLFailed: '',
    //     GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/gw.php?Q=PAY&SESSIONKEY=72110146191078463D7FA938FDA9EC81',
    //     storeBanner: '',
    //     storeLogo: '',
    //     desc: [
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object]
    //     ],
    //     is_direct_pay_enable: '0'
    //   }
    // }
    // {
    //   gatewayResponse: {
    //     status: 'SUCCESS',
    //     failedreason: '',
    //     sessionkey: '72110146191078463D7FA938FDA9EC81',
    //     gw: {
    //       visa: 'city_visa,ebl_visa,visacard',
    //       master: 'city_master,ebl_master,mastercard',
    //       amex: 'city_amex,amexcard',
    //       othercards: 'qcash,fastcash',
    //       internetbanking: 'city,bankasia,ibbl,mtbl',
    //       mobilebanking: 'dbblmobilebanking,bkash,abbank,ibbl'
    //     },
    //     redirectGatewayURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/bankgw/indexhtml.php?mamount=499.00&ssl_id=251223203600rvFUfBeDrvKCpIc&Q=REDIRECT&SESSIONKEY=72110146191078463D7FA938FDA9EC81&tran_type=success&cardname=',
    //     directPaymentURLBank: '',
    //     directPaymentURLCard: '',
    //     directPaymentURL: '',
    //     redirectGatewayURLFailed: '',
    //     GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/gw.php?Q=PAY&SESSIONKEY=72110146191078463D7FA938FDA9EC81',
    //     storeBanner: '',
    //     storeLogo: '',
    //     desc: [
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object]
    //     ],
    //     is_direct_pay_enable: '0'
    //   }
    // }
    // results
    // {
    //   paymentId: '6c9705be-1e19-4c49-9946-2e9cc598bf0a',
    //   gatewayResponse: {
    //     status: 'SUCCESS',
    //     failedreason: '',
    //     sessionkey: '72110146191078463D7FA938FDA9EC81',
    //     gw: {
    //       visa: 'city_visa,ebl_visa,visacard',
    //       master: 'city_master,ebl_master,mastercard',
    //       amex: 'city_amex,amexcard',
    //       othercards: 'qcash,fastcash',
    //       internetbanking: 'city,bankasia,ibbl,mtbl',
    //       mobilebanking: 'dbblmobilebanking,bkash,abbank,ibbl'
    //     },
    //     redirectGatewayURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/bankgw/indexhtml.php?mamount=499.00&ssl_id=251223203600rvFUfBeDrvKCpIc&Q=REDIRECT&SESSIONKEY=72110146191078463D7FA938FDA9EC81&tran_type=success&cardname=',
    //     directPaymentURLBank: '',
    //     directPaymentURLCard: '',
    //     directPaymentURL: '',
    //     redirectGatewayURLFailed: '',
    //     GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/gw.php?Q=PAY&SESSIONKEY=72110146191078463D7FA938FDA9EC81',
    //     storeBanner: '',
    //     storeLogo: '',
    //     desc: [
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object], [Object],
    //       [Object]
    //     ],
    //     is_direct_pay_enable: '0'
    //   }
    // }
    return resData;
  } catch (error: any) {
    if (envVars.NODE_ENV === "Development") {
      console.log(error);
    }
    throw new customError(StatusCodes.BAD_REQUEST, error.message);
  }
};

const verifyAndFinalizePayment = async (payload: any) => {
console.log("SSL hit for verifying payment");

console.log({payload, "envVars.SSL.SSL_SECRET_KEY":envVars.SSL.SSL_SECRET_KEY});


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
      id: payment.explorerId
    }
  })

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

  // const subs = await prisma.$transaction(async (tx) => {
  //   await tx.payment.update({
  //     where: { id: payment.id },
  //     data: {
  //       status: PaymentStatus.PAID,
  //       rawResponse: toJsonValue(payload),
  //     },
  //   })

  //   await tx.explorer.update({
  //     where: {
  //       id: explorer.id
  //     },
  //     data: {
  //       isPremium: true,
  //     }
  //   }),
  //     await tx.subscription.create({
  //       data: {
  //         explorerId: explorer.id,
  //         planName: payment.planName,
  //         startDate,
  //         endDate,
  //         paymentId: payment.id,
  //         isActive: true,
  //       }
  //     })
  //   return await tx.subscription.findFirst({ where: { explorerId: explorer.id } })
  // })

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


  console.log({subs});


  return { success: true, subs };
};

/**
 * handleSslCommerzCallback - alias for verifyAndFinalizePayment maintained for compatibility
 */
const handleSslCommerzCallback = verifyAndFinalizePayment;

const getAllSubscription = async (query: Record<string, string>) => {

  const { where, take, skip, orderBy } = prismaQueryBuilder(query, [
    "planName",
    "status",
    "isActive",
    "endDate",
    "startDate",
  ]);

  const [data, total] = await prisma.$transaction([
    prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        explorer: true,
        payment: true,
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  return {
    meta: {
      total,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    },
    data,
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
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
    include: { subscription: true },
  });

  if (!explorer)
    throw new customError(StatusCodes.NOT_FOUND, "Explorer profile not found");

  return explorer.subscription ?? null;
};

export const subscriptionService = {

  verifyAndFinalizePayment,
  createSubscription,
  handleSslCommerzCallback,
  getMySubscription,
  getSingleSubscription,
  getAllSubscription,
};
