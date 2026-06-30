import { z } from "zod";

export const supervisorOrganizationUpdateSchema = z
  .object({
    plan: z.enum(["TRIAL", "BASIC", "PRO", "ENTERPRISE"]).optional(),
    status: z.enum(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"]).optional(),
    extendTrialDays: z.number().int().min(1).max(90).optional(),
    grantProMonths: z.number().int().min(1).max(60).optional(),
  })
  .refine(
    (data) =>
      data.plan !== undefined ||
      data.status !== undefined ||
      data.extendTrialDays !== undefined ||
      data.grantProMonths !== undefined,
    { message: "Nothing to update" },
  );

export type SupervisorOrganizationUpdateInput = z.infer<typeof supervisorOrganizationUpdateSchema>;
