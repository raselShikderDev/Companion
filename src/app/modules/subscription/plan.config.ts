export const PLANS = {
  FREE: { price: 0, matches: 3, durationDays: 0 },
  STANDARD: { price: 499, matches: 12, durationDays: 30 },
  PREMIUM: { price: 799, matches: 25, durationDays: 30 },
} as const;

export type PlanName = keyof typeof PLANS;