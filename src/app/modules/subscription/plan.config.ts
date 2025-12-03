// export const PLANS = {
//   FREE: { price: 0, matches: 3, durationDays: 0 },
//   STANDARD: { price: 499, matches: 12, durationDays: 30 },
//   PREMIUM: { price: 799, matches: 25, durationDays: 30 },
// } as const;

// export type PlanName = keyof typeof PLANS;

import { SubscriptionPlan } from "@prisma/client";
import { PlanInfo } from "./subscription.interface";

export const PLANS: Record<SubscriptionPlan, PlanInfo> = {
  FREE: { name: SubscriptionPlan.FREE, priceBDT: 0, allowedMatches: 3, durationDays: 30 },
  STANDARD: { name: SubscriptionPlan.STANDARD, priceBDT: 499, allowedMatches: 12, durationDays: 30 },
  PREMIUM: { name: SubscriptionPlan.PREMIUM, priceBDT: 799, allowedMatches: 25, durationDays: 30 },
};
