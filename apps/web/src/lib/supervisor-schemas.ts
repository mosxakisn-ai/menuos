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

export const supervisorAddOperatorSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid username")
    .transform((s) => s.toLowerCase()),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
});

export type SupervisorAddOperatorInput = z.infer<typeof supervisorAddOperatorSchema>;

export const supervisorUpdateOperatorSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    password: z.string().min(8).max(128).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.password !== undefined || data.active !== undefined, {
    message: "Nothing to update",
  });

export type SupervisorUpdateOperatorInput = z.infer<typeof supervisorUpdateOperatorSchema>;
