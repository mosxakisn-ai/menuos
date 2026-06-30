import { z } from "zod";
import { ORGANIZATION_ACTIVITIES } from "@menuos/shared";

const nullableTrimmedString = (max: number) =>
  z
    .union([z.string().max(max), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const trimmed = v.trim();
      return trimmed === "" ? null : trimmed;
    });

export const supervisorOrganizationUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    adminEmail: z.string().trim().email().max(254).optional(),
    phone: nullableTrimmedString(40),
    mobile: nullableTrimmedString(40),
    vatNumber: nullableTrimmedString(20).refine(
      (v) => v === undefined || v === null || /^\d{9}$/.test(v),
      { message: "Ο ΑΦΜ πρέπει να είναι 9 ψηφία." },
    ),
    activity: z
      .union([z.enum(ORGANIZATION_ACTIVITIES), z.null()])
      .optional(),
    city: nullableTrimmedString(120),
    notes: nullableTrimmedString(2000),
    plan: z.enum(["TRIAL", "BASIC", "PRO", "ENTERPRISE"]).optional(),
    status: z.enum(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"]).optional(),
    extendTrialDays: z.number().int().min(1).max(90).optional(),
    grantProMonths: z.number().int().min(1).max(60).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.adminEmail !== undefined ||
      data.phone !== undefined ||
      data.mobile !== undefined ||
      data.vatNumber !== undefined ||
      data.activity !== undefined ||
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

export const supervisorPlanUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    priceMonthly: z.number().min(0).max(99999).optional(),
    priceDisplay: z
      .union([z.string().max(40), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      }),
    periodLabel: z.string().trim().min(1).max(40).optional(),
    description: z
      .union([z.string().max(500), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      }),
    features: z.array(z.string().trim().min(1).max(200)).min(1).max(30).optional(),
    maxVenues: z.number().int().min(1).max(9999).optional(),
    maxMenusPerVenue: z
      .union([z.number().int().min(1).max(9999), z.null()])
      .optional(),
    maxItems: z
      .union([z.number().int().min(1).max(999999), z.null()])
      .optional(),
    ctaLabel: z
      .union([z.string().max(80), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      }),
    badge: z
      .union([z.string().max(40), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      }),
    highlighted: z.boolean().optional(),
    visibleOnPricing: z.boolean().optional(),
    trialDays: z
      .union([z.number().int().min(1).max(365), z.null()])
      .optional(),
    sortOrder: z.number().int().min(0).max(99).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.priceMonthly !== undefined ||
      data.priceDisplay !== undefined ||
      data.periodLabel !== undefined ||
      data.description !== undefined ||
      data.features !== undefined ||
      data.maxVenues !== undefined ||
      data.maxMenusPerVenue !== undefined ||
      data.maxItems !== undefined ||
      data.ctaLabel !== undefined ||
      data.badge !== undefined ||
      data.highlighted !== undefined ||
      data.visibleOnPricing !== undefined ||
      data.trialDays !== undefined ||
      data.sortOrder !== undefined,
    { message: "Nothing to update" },
  );

export type SupervisorPlanUpdateInput = z.infer<typeof supervisorPlanUpdateSchema>;
