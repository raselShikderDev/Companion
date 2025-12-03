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