import { z } from "zod";
import { SubscriptionPlan } from "@prisma/client";

export const initiatePaymentSchema = z.object({
  plan: z.enum(SubscriptionPlan).refine(p => p !== SubscriptionPlan.FREE, "Cannot pay for FREE"),
  returnUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
  ipnUrl: z.url().optional(),
  amount: z.number().positive().optional(),
});

export const paymentCallbackSchema = z.object({
  tran_id: z.string().optional(),
  val_id: z.string().optional(),
  status: z.string().optional(),
});


export const createSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan).refine(p => p !== SubscriptionPlan.FREE, {
    message: "Cannot purchase FREE plan",
  }),
});

// webhook from gateway — minimal validation of body shape
export const sslCommerzWebhookSchema = z.object({
  tran_id: z.string(),
  val_id: z.string().optional(),
  amount: z.union([z.string(), z.number()]),
  currency: z.string().optional(),
  status: z.string(),
  store_id: z.string().optional(),
  // add other fields you expect
});