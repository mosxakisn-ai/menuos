DO $$ BEGIN
  CREATE TYPE "CuisineType" AS ENUM (
    'MEDITERRANEAN',
    'GREEK',
    'ITALIAN',
    'GOURMET',
    'SEAFOOD',
    'GRILL',
    'CAFE_BAR',
    'ASIAN',
    'INTERNATIONAL',
    'VEGETARIAN',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Venue"
  ADD COLUMN IF NOT EXISTS "cuisineType" "CuisineType";
