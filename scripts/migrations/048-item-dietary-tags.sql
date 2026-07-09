-- Item promotional badges, dietary tags, structured allergen codes
ALTER TYPE "ItemLabel" ADD VALUE IF NOT EXISTS 'CHEF';
ALTER TYPE "ItemLabel" ADD VALUE IF NOT EXISTS 'SEASONAL';
ALTER TYPE "ItemLabel" ADD VALUE IF NOT EXISTS 'RECOMMENDED';

ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "dietaryTags" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "allergenCodes" JSONB NOT NULL DEFAULT '[]'::jsonb;
