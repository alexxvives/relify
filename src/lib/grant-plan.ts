import * as z from "zod";

export const grantPlanSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  plan: z.enum(["none", "limited", "unlimited"]),
});
