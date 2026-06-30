import { z } from "zod";

export const supervisorOrganizationUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    phone: z
      .union([z.string().max(40), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      }),
    city: z
      .union([z.string().max(120), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      }),
    notes: z
      .union([z.string().max(2000), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      }),
    plan: z.enum(["TRIAL", "BASIC", "PRO", "ENTERPRISE"]).optional(),
    status: z.enum(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"]).optional(),
    extendTrialDays: z.number().int().min(1).max(90).optional(),
    grantProMonths: z.number().int().min(1).max(60).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.city !== undefined ||
      data.notes !== undefined ||
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

export const supervisorChangeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ",
    path: ["newPassword"],
  });

export type SupervisorChangeOwnPasswordInput = z.infer<typeof supervisorChangeOwnPasswordSchema>;
