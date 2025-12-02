import { z } from "zod";
import { MatchStatus } from "@prisma/client";

export const createMatchSchema = z.object({
  recipientId: z.uuid("Invalid recipientId"),
});

export const updateMatchStatusSchema = z.object({
  status: z.enum(MatchStatus),
});
