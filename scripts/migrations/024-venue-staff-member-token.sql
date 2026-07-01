-- Per-staff personal waiter link token

ALTER TABLE "VenueStaffMember" ADD COLUMN IF NOT EXISTS "memberToken" TEXT;

UPDATE "VenueStaffMember"
SET "memberToken" = gen_random_uuid()::text
WHERE "memberToken" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "VenueStaffMember_memberToken_key" ON "VenueStaffMember" ("memberToken");

ALTER TABLE "VenueStaffMember" ALTER COLUMN "memberToken" SET NOT NULL;
