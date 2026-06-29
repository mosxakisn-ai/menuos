import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  businessName: z.string().min(2).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  tableNumber: z.string().max(20).optional(),
  roomNumber: z.string().max(20).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type WaiterCallInput = z.infer<typeof waiterCallSchema>;
