DO $$ BEGIN
  CREATE TYPE "OrganizationActivity" AS ENUM ('RESTAURANT', 'HOTEL', 'CAFE_BAR', 'BEACH_BAR', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "mobile" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "vatNumber" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "activity" "OrganizationActivity";
