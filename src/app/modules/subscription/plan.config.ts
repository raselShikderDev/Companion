/** biome-ignore-all lint/style/useImportType: <> */

import { SubscriptionPlan } from "@prisma/client";

export const PLANS= {
  FREE: {
    name: SubscriptionPlan.FREE,
    priceBDT: 0,
    allowedMatches: 3,
    durationDays: 365,
  },
  STANDARD: {
    name: SubscriptionPlan.STANDARD,
    priceBDT: 499,
    allowedMatches: 12,
    durationDays: 365,
  },
  PREMIUM: {
    name: SubscriptionPlan.PREMIUM,
    priceBDT: 799,
    allowedMatches: 25,
    durationDays: 365,
  },
};
