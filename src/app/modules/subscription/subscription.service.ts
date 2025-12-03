
import { prisma } from "../../configs/db.config";

import { CreatePaymentInput, CreateSubscriptionInput } from "./subscription.interface";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { PaymentStatus, SubscriptionPlan } from "@prisma/client";
import { envVars } from "../../configs/envVars";
import { PLANS } from "./plan.config";
import crypto from "crypto";

/**
 * Create payment session for SSLCommerz
 * - Creates a PENDING Payment row and returns a paymentUrl or payload for the frontend
 */
 const createSubscription = async (userId: string, input: CreateSubscriptionInput) => {
  // 1. Resolve explorer by userId
  const explorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!explorer) throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");

  const plan = PLANS[input.plan as SubscriptionPlan];
  if (!plan || plan.priceBDT <= 0) throw new customError(StatusCodes.BAD_REQUEST, "Invalid plan");

  // 2. Create a Payment record (PENDING)
  const txReference = crypto.randomUUID(); // idempotency token
  const amount = plan.priceBDT;

  const payment = await prisma.payment.create({
    data: {
      explorerId: explorer.id,
      amount: amount,
      currency: "BDT",
      status: PaymentStatus.PENDING,
      planName:plan.name,
      transactionId:txReference,
      gateway:"SSLCOMMERZ",
      rawResponse: { plan: plan.name, userId },
    },
  });

  // 3. Build SSLCommerz request payload (example)
  // NOTE: you must construct per SSLCommerz docs — I show a sample
  const sslPayload = {
    store_id: envVars.SSL.SSL_STORE_ID as string,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASS,
    total_amount: amount,
    currency: "BDT",
    tran_id: payment.transactionId, // use the txReference as tran_id
    success_url: `${process.env.APP_URL}/api/subscriptions/webhook/sslcommerz`, // they will call webhook
    fail_url: `${process.env.APP_URL}/payment/failed`,
    cancel_url: `${process.env.APP_URL}/payment/cancel`,
    cus_name: explorer.fullName,
    cus_email: (await prisma.user.findUnique({ where: { id: explorer.userId } }))?.email,
    // product_category, shipping_method, value_a etc...
    value_a: explorer.id,
  };

  // Return payment record + payload for client to request SSLCommerz checkout
  // You might call SSLCommerz API server-side here to get a Gateway URL
  return { payment, sslPayload };
};

/**
 * Handler for SSLCommerz webhook/callback — must be idempotent and securely verify
 * This should be called by SSLCommerz server side when payment succeed/fail
 */
 const handleSslCommerzCallback = async (body: any) => {
  // Validate body shape (use the zod schema earlier in controller)
  const data = body;

  // Important: verify store_id / validation as per SSLCommerz docs if available.
  // Example basic verification:
  const tranId = String(data.tran_id || data.value_a || data.val_id);
  const status = String(data.status || "").toUpperCase(); // "VALID" or "FAILED"? depends on provider
  const amount = Number(data.amount || data.total_amount || 0);

  // Find our Payment by providerTxId (we used tran_id = providerTxId)
  const payment = await prisma.payment.findUnique({ where: { transactionId: tranId } });

  if (!payment) {
    // If no payment found by tranId, try to find using other metadata
    // log and ignore (avoid throwing)
    throw new customError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  // Idempotency: if already PAID, ignore
  if (payment.status === "PAID") {
    return payment;
  }

  // Validate amount matches plan amount from metadata
  const metadata = payment.rawResponse as any;
  const planName: SubscriptionPlan = metadata?.plan;
  const plan = PLANS[planName];
  if (!plan) throw new customError(StatusCodes.BAD_REQUEST, "Invalid plan on payment");

  if (amount !== plan.priceBDT) {
    // Potential tampering: do not activate subscription
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawResponse: { ...payment.rawResponse as any, providerBody: data } },
    });
    throw new customError(StatusCodes.BAD_REQUEST, "Amount mismatch");
  }

  // If provider indicates success, perform transaction:
  if (status === "VALID" || status === "SUCCESS" || status === "Completed") {
    // Use transaction to create Subscription, update Explorer.isPremium, and update Payment to PAID
    const explorerId = payment.explorerId;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const [updatedPayment, createdSubscription, updatedExplorer] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          transactionId: data.val_id || data.val_id || payment.transactionId, // provider's tx id if present
          rawResponse: { ...payment.rawResponse as any, providerBody: data },
        },
      }),
      prisma.subscription.upsert({
        where: { explorerId },
        update: {
          planName: plan.name,
          startDate,
          endDate,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          explorerId,
          planName: plan.name,
          startDate,
          endDate,
          isActive: true,
        },
      }),
      prisma.explorer.update({
        where: { id: explorerId },
        data: {
          isPremium: plan.name === "PREMIUM" || plan.name === "STANDARD", // or however you decide
          updatedAt: new Date(),
        },
      }),
    ]);

    // return result
    return { payment: updatedPayment, subscription: createdSubscription, explorer: updatedExplorer };
  } else {
    // Mark failed
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rawResponse: { ...payment.rawResponse as any, providerBody: data } } });
    throw new customError(StatusCodes.BAD_REQUEST, "Payment failed");
  }
};


function buildSslCommerzRequestBody({
  orderId,
  amount,
  currency = "BDT",
  returnUrl,
  cancelUrl,
  ipnUrl,
  productName = "Subscription",
  customerName,
  customerEmail,
  customerPhone,
}: {
  orderId: string;
  amount: number;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  productName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  // Format per SSLCommerz docs. Keep minimal required fields.
  return {
    store_id: envVars.SSL.SSL_STORE_ID as string,
    store_passwd:envVars.SSL.SSL_SECRET_KEY as string,
    total_amount: amount,
    currency,
    tran_id: orderId, // you supply a unique tran id
    success_url: returnUrl,
    fail_url: cancelUrl,
    cancel_url: cancelUrl,
    ipn_url: ipnUrl,
    product_name: productName,
    cus_name: customerName,
    cus_email: customerEmail,
    cus_phone: customerPhone,
  };
}

 const initiatePayment = async (userId: string, input: CreatePaymentInput) => {
  const planKey = input.plan as keyof typeof PLANS;
  const planCfg = PLANS[planKey];
  if (!planCfg || planKey === SubscriptionPlan.FREE) {
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid plan");
  }

  const amount = input.amount ?? planCfg.priceBDT;
  if (amount !== planCfg.priceBDT) {
    // Protect against forged custom amounts
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid amount for selected plan");
  }

  // 1) create a PENDING Payment record (use userId -> explorerId mapping)
  const explorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!explorer) throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");

  const orderId = `sub_${explorer.id}_${Date.now()}`; // unique tran id

  const pendingPayment = await prisma.payment.create({
    data: {
      explorerId: explorer.id,
      planName: input.plan,
      amount,
      gateway: "SSLCOMMERZ",
      status: "PENDING",
      currency: "BDT",
    },
  });

  // 2) prepare SSLCommerz request body, POST to their create payment endpoint
  const body = buildSslCommerzRequestBody({
    orderId,
    amount,
    returnUrl: input.returnUrl ?? `${process.env.APP_BASE_URL}/payments/success`,
    cancelUrl: input.cancelUrl ?? `${process.env.APP_BASE_URL}/payments/cancel`,
    ipnUrl: input.ipnUrl ?? `${process.env.APP_BASE_URL}/webhooks/sslcommerz`,
    customerName: "", // fill if available
    customerEmail: "",
    customerPhone: "",
  });

  // POST to SSLCommerz to get checkout URL / session
  const res = await fetch(`${envVars.SSL.SSL_PAYMENT_API as string}/initiate-payment`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    // You may need basic auth depending on API version
  });

  if (!res.ok) {
    // mark payment as FAILED and explain
    await prisma.payment.update({
      where: { id: pendingPayment.id },
      data: { status: "FAILED", rawResponse: { error: await res.text() } },
    });
    throw new customError(StatusCodes.BAD_GATEWAY, "Payment gateway error");
  }

  const gatewayResp = await res.json();
  // gatewayResp should contain a checkout URL or session token
  // Save response for later
  await prisma.payment.update({ where: { id: pendingPayment.id }, data: { rawResponse: gatewayResp } });

  return {
    paymentId: pendingPayment.id,
    gatewayResponse: gatewayResp,
  };
};

/**
 * verifyAndFinalizePayment
 * Called on IPN/webhook or after redirect to your success URL (server should contact SSLCommerz validation API)
 */
 const verifyAndFinalizePayment = async (payload: any) => {
  // payload will contain tran_id or val_id depending on flow
  const tranId = payload.tran_id ?? payload.tran_id;
  if (!tranId) {
    throw new customError(StatusCodes.BAD_REQUEST, "Missing tran_id");
  }

  // 1) find PENDING payment (avoid duplicates)
  const payment = await prisma.payment.findFirst({ where: { transactionId: tranId } })
    // sometimes payment.transactionId isn't set until verification; we find by pattern in rawResponse or tran id mapping
  ;

  // If not found by transactionId, try to find a PENDING payment for the explorer using other data in payload
  // For this example, assume tranId equals the tran id we gave earlier; search by rawResponse.tran_id or similar
  // Implementation detail: store mapping of tran_id -> payment.transactionId when initiating if returned by gateway

  // For safety, always call SSLCommerz validate endpoint to confirm status
  // Validation request (example - replace endpoint with actual SSLCommerz validation endpoint)
  const validationUrl = `${envVars.SSL.SSL_PAYMENT_API as string}/validator/api/validationserverAPI.php?val_id=${payload.val_id}&store_id=${envVars.SSL.SSL_STORE_ID as string}&store_passwd=${envVars.SSL.SSL_STORE_ID}&v=1&format=json`;

  const valRes = await fetch(validationUrl);
  if (!valRes.ok) throw new customError(StatusCodes.BAD_GATEWAY, "Gateway validation failed");
  const valJson = await valRes.json();

  // Check status
  const status = valJson.status; // "VALID" or similar, check docs
  // Validate amount and currency against stored payment (important to avoid tampering)
  const tranIdFromVal = valJson.tran_id;
  // Find payment by transactionId or by order id mapping
  const storedPayment = await prisma.payment.findFirst({
    where: { transactionId: tranIdFromVal },
  });

  if (!storedPayment) {
    // If none, we may try to match by explorer & amount, or throw
    // For safety, refuse to create subscription without clear associated payment
    throw new customError(StatusCodes.NOT_FOUND, "Payment record not found for transaction");
  }

  // Validate amount strictly matches
  const expectedAmount = storedPayment.amount;
  const paidAmount = parseFloat(valJson.amount ?? "0");
  if (paidAmount !== expectedAmount) {
    // suspicious, possible tampering
    await prisma.payment.update({
      where: { id: storedPayment.id },
      data: { status: "FAILED", rawResponse: valJson },
    });
    throw new customError(StatusCodes.BAD_REQUEST, "Paid amount does not match expected amount");
  }

  // If status indicates success, finalize in a transaction:
  if (status === "VALID" || status === "VALIDATED" || valJson.status === "VALID") {
    const planName = storedPayment.planName as SubscriptionPlan;
    const planCfg = PLANS[planName];

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + planCfg.durationDays * 24 * 60 * 60 * 1000);

    // atomic update/create subscription & payment
    const [updatedPayment, upsertedSubscription, updatedExplorer] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: storedPayment.id },
        data: {
          status: PaymentStatus.PAID,
          transactionId: tranIdFromVal,
          rawResponse: valJson,
        },
      }),
      // Upsert subscription for explorer: set start and end
      prisma.subscription.upsert({
        where: { explorerId: storedPayment.explorerId }, // explorerId is unique in Subscription model
        create: {
          explorerId: storedPayment.explorerId,
          planName,
          startDate,
          endDate,
          isActive: true,
        },
        update: {
          planName,
          startDate,
          endDate,
          isActive: true,
        },
      }),
      // Update explorer flags
      prisma.explorer.update({
        where: { id: storedPayment.explorerId },
        data: {
          isPremium: planName !== "FREE", // set true for standard/premium
          updatedAt: new Date(),
        },
      }),
    ]);

    return { success: true, payment: updatedPayment, subscription: upsertedSubscription };
  } else {
    // mark as failed
    await prisma.payment.update({
      where: { id: storedPayment.id },
      data: { status: PaymentStatus.FAILED, rawResponse: valJson },
    });
    return { success: false, reason: "Payment validation failed", raw: valJson };
  }
};


export const subscriptionService ={
    initiatePayment,
    verifyAndFinalizePayment,
    createSubscription,
    handleSslCommerzCallback
}