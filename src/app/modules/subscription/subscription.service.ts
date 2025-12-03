
import { prisma } from "../../configs/db.config";
import { PLANS } from "./plan.config";
import { CreatePaymentInput } from "./subscription.interface";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { PaymentStatus, SubscriptionPlan } from "@prisma/client";
import { envVars } from "../../configs/envVars";



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

export const initiatePayment = async (userId: string, input: CreatePaymentInput) => {
  const planKey = input.plan as keyof typeof PLANS;
  const planCfg = PLANS[planKey];
  if (!planCfg || planKey === SubscriptionPlan.FREE) {
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid plan");
  }

  const amount = input.amount ?? planCfg.price;
  if (amount !== planCfg.price) {
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
export const verifyAndFinalizePayment = async (payload: any) => {
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
