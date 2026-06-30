import { z } from "zod";
import { itemExtrasSchema } from "./item-extras";

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

export const changePasswordSchema = z
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

export const waiterCallSchema = z
  .object({
    venueSlug: z.string().min(1),
    type: z.enum(["WAITER", "BILL", "ORDER"]).default("WAITER"),
    tableNumber: z.string().max(20).optional(),
    roomNumber: z.string().max(20).optional(),
    sunbedNumber: z.string().max(20).optional(),
    orderItems: z
      .object({
        lines: z.array(
          z.object({
            itemId: z.string().min(1).max(50),
            name: z.string().min(1).max(120),
            quantity: z.number().int().min(1).max(99),
            unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
            extraIds: z.array(z.string().min(1).max(32)).max(12).optional(),
            extras: z.array(z.string().max(60)).max(12).optional(),
            note: z.string().max(80).optional(),
          }),
        ),
        total: z.string(),
        lang: z.string().max(5).optional(),
      })
      .optional(),
  })
  .refine((d) => d.type !== "ORDER" || (d.orderItems?.lines?.length ?? 0) > 0, {
    message: "ORDER requires orderItems",
  })
  .refine(
    (d) => {
      const n = [d.tableNumber, d.roomNumber, d.sunbedNumber].filter((v) => v?.trim()).length;
      return n <= 1;
    },
    { message: "Only one location field allowed" },
  );

export const waiterCallCancelSchema = z.object({
  venueSlug: z.string().min(1),
  callId: z.string().min(1),
  tableNumber: z.string().max(20).optional(),
  roomNumber: z.string().max(20).optional(),
  sunbedNumber: z.string().max(20).optional(),
});

export const venueSpotTypeSchema = z.enum(["TABLE", "ROOM", "SUNBED"]);

export const venueSpotLabelSchema = z
  .string()
  .min(1)
  .max(20)
  .trim()
  .regex(/^[a-zA-Z0-9\u0370-\u03FF\u1F00-\u1FFF_-]+$/, {
    message: "Μόνο γράμματα, αριθμοί, παύλα και κάτω παύλα.",
  });

const venueSpotLabelPattern = /^[a-zA-Z0-9\u0370-\u03FF\u1F00-\u1FFF_-]+$/;

export const venueSpotPrefixSchema = z
  .string()
  .max(15)
  .trim()
  .optional()
  .default("")
  .refine((prefix) => !prefix || venueSpotLabelPattern.test(prefix), {
    message: "Άκυρο πρόθεμα — μόνο γράμματα, αριθμοί, παύλα και κάτω παύλα.",
  });

export const venueSpotCreateSchema = z.object({
  type: venueSpotTypeSchema,
  label: venueSpotLabelSchema,
});

export const venueSpotUpdateSchema = z.object({
  label: venueSpotLabelSchema,
});

export const venueSpotBulkCreateSchema = z
  .object({
    type: venueSpotTypeSchema,
    from: z.number().int().min(1).max(999),
    to: z.number().int().min(1).max(999),
    prefix: venueSpotPrefixSchema,
  })
  .refine((d) => d.to >= d.from, { message: "Το 'έως' πρέπει να είναι ≥ 'από'." })
  .refine((d) => d.to - d.from < 200, { message: "Μέγιστο 200 θέσεις ανά φορά." })
  .refine(
    (d) => {
      const prefix = d.prefix ?? "";
      for (let n = d.from; n <= d.to; n++) {
        if (`${prefix}${n}`.length > 20) return false;
      }
      return true;
    },
    { message: "Το πρόθεμα + αριθμός ξεπερνά 20 χαρακτήρες." },
  )
  .refine(
    (d) => {
      const prefix = d.prefix ?? "";
      for (let n = d.from; n <= d.to; n++) {
        if (!venueSpotLabelSchema.safeParse(`${prefix}${n}`).success) return false;
      }
      return true;
    },
    { message: "Άκυρο πρόθεμα ή όνομα θέσης." },
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterOtpSendInput = z.infer<typeof registerOtpSendSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
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
  extras: itemExtrasSchema.optional(),
});

export const venueUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  logoUrl: z
    .union([z.string().url().max(2048), z.literal(""), z.null()])
    .optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const waiterCallUpdateSchema = z.object({
  status: z.enum(["ACKNOWLEDGED", "COMPLETED"]),
  staffKey: z.string().min(8).max(128).optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(256),
  }),
  staffKey: z.string().min(8).max(128).optional(),
  venueId: z.string().min(1).max(64).optional(),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  staffKey: z.string().min(8).max(128).optional(),
  venueId: z.string().min(1).max(64).optional(),
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
    extras: itemExtrasSchema.optional(),
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
      d.nameFr !== undefined ||
      d.extras !== undefined,
    { message: "Nothing to update" },
  );

export type ItemPatchInput = z.infer<typeof itemPatchSchema>;
export type MenuCreateInput = z.infer<typeof menuCreateSchema>;
export type MenuImportApplyInput = z.infer<typeof menuImportApplySchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type VenueUpdateInput = z.infer<typeof venueUpdateSchema>;

export function zodFirstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Μη έγκυρα στοιχεία.";
}
