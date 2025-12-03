import { z } from "zod";
export const confirmTokenSchema = z.object({
  token: z.string().min(10),
});
