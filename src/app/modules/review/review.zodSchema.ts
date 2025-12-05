import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    matchId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
});


export const adminReviewStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  })
});