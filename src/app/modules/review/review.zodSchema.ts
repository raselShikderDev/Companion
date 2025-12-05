import { ReviewStatus } from "@prisma/client";
import { z } from "zod";

export const createReviewSchema = z.object({
  matchId: z.uuid("Invalid match id"),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export const adminReviewStatusSchema = z.object({
  status: z.enum(ReviewStatus),
});
