import { SubscriptionPlan } from "@prisma/client";

export interface CreatePaymentInput {
  plan: SubscriptionPlan; // "STANDARD" | "PREMIUM"
  amount?: number;        // optional override, validated against plan
  returnUrl?: string;     // where SSLCommerz redirects after payment (client)
  cancelUrl?: string;
  ipnUrl?: string;        // server IPN/webhook endpoint
}

export interface PaymentVerificationPayload {
  val_id?: string;
  tran_id?: string;
  status?: string;
  // other sslcommerz fields sent back
}



export type PlanInfo = {
  name: SubscriptionPlan;
  priceBDT: number;
  allowedMatches: number;
  durationDays: number;
};

export interface CreateSubscriptionInput {
  plan: SubscriptionPlan; // "STANDARD" | "PREMIUM"
}

export interface PaymentRecord {
  provider: string;
  providerTxId?: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED";
  metadata?: Record<string, any>;
}