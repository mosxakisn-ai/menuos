import { z } from "zod";

export const registerOtpSendSchema = z.object({
  email: z.string().email().max(254),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  businessName: z.string().min(2).max(120),
  otp: z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const loginSchema = z.object({
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export const venueSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase latin with hyphens"),
  description: z.string().max(500).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(120),
  language: z.enum(["GR", "EN", "DE", "FR"]),
});

export const itemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  ingredients: z.string().max(500).optional(),
  allergens: z.string().max(500).optional(),
  price: z.number().min(0).max(99999),
  language: z.enum(["GR", "EN", "DE", "FR"]),
  available: z.boolean().optional(),
});

export const waiterCallSchema = z.object({
  venueSlug: z.string().min(1),
  type: z.enum(["WAITER", "BILL"]).default("WAITER"),
  tableNumber: z.string().max(20).optional(),
  roomNumber: z.string().max(20).optional(),
});

export const waiterCallCancelSchema = z.object({
  venueSlug: z.string().min(1),
  callId: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterOtpSendInput = z.infer<typeof registerOtpSendSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export const categoryCreateSchema = z.object({
  menuId: z.string().min(1),
  nameGr: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional(),
  nameDe: z.string().max(120).optional(),
  nameFr: z.string().max(120).optional(),
});

export const itemLabelSchema = z.enum(["OFFER", "BEST", "NEW"]).nullable();

export const itemCreateSchema = z.object({
  categoryId: z.string().min(1),
  price: z.number().min(0).max(99999),
  nameGr: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional(),
  nameDe: z.string().max(120).optional(),
  nameFr: z.string().max(120).optional(),
  label: itemLabelSchema.optional(),
  photoUrl: z
    .union([z.string().url().max(2048), z.literal(""), z.null()])
    .optional(),
  descriptionGr: z.string().max(1000).optional(),
  descriptionEn: z.string().max(1000).optional(),
  ingredientsGr: z.string().max(500).optional(),
  allergensGr: z.string().max(500).optional(),
  available: z.boolean().optional(),
});

export const venueUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const waiterCallUpdateSchema = z.object({
  status: z.enum(["PENDING", "ACKNOWLEDGED", "COMPLETED"]),
});

export const menuImportItemSchema = z.object({
  nameGr: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional(),
  nameDe: z.string().max(120).optional(),
  nameFr: z.string().max(120).optional(),
  price: z.number().min(0).max(99999),
  descriptionGr: z.string().max(1000).optional(),
  selected: z.boolean().optional(),
});

export const menuImportCategorySchema = z.object({
  nameGr: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional(),
  nameDe: z.string().max(120).optional(),
  nameFr: z.string().max(120).optional(),
  selected: z.boolean().optional(),
  items: z.array(menuImportItemSchema),
});

export const menuImportApplySchema = z.object({
  menuId: z.string().min(1),
  categories: z.array(menuImportCategorySchema).min(1),
});

export const menuCreateSchema = z.object({
  venueId: z.string().min(1),
  name: z.string().min(1).max(120),
  type: z
    .enum(["BREAKFAST", "RESTAURANT", "POOL_BAR", "BEACH_BAR", "ROOM_SERVICE", "SPA", "ACTIVITIES", "OTHER"])
    .optional(),
});

export const itemPatchSchema = z
  .object({
    available: z.boolean().optional(),
    price: z.number().finite().min(0).max(99999).optional(),
    label: itemLabelSchema.optional(),
    photoUrl: z
      .union([z.string().url().max(2048), z.literal(""), z.null()])
      .optional(),
    nameGr: z.string().min(1).max(120).optional(),
    nameEn: z.string().max(120).optional(),
    nameDe: z.string().max(120).optional(),
    nameFr: z.string().max(120).optional(),
  })
  .refine(
    (d) =>
      d.available !== undefined ||
      d.price !== undefined ||
      d.label !== undefined ||
      d.photoUrl !== undefined ||
      d.nameGr !== undefined ||
      d.nameEn !== undefined ||
      d.nameDe !== undefined ||
      d.nameFr !== undefined,
    { message: "Nothing to update" },
  );

export type ItemPatchInput = z.infer<typeof itemPatchSchema>;
export type MenuCreateInput = z.infer<typeof menuCreateSchema>;
export type MenuImportApplyInput = z.infer<typeof menuImportApplySchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type VenueUpdateInput = z.infer<typeof venueUpdateSchema>;
