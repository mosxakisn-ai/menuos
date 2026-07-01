-- Cold kitchen + dessert pass screen tokens (same pattern as KDS/BDS)

ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "coldScreenToken" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "dessertScreenToken" TEXT;

UPDATE "Venue"
SET "coldScreenToken" = gen_random_uuid()::text
WHERE "coldScreenToken" IS NULL;

UPDATE "Venue"
SET "dessertScreenToken" = gen_random_uuid()::text
WHERE "dessertScreenToken" IS NULL;

ALTER TABLE "Venue" ALTER COLUMN "coldScreenToken" SET NOT NULL;
ALTER TABLE "Venue" ALTER COLUMN "dessertScreenToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Venue_coldScreenToken_key" ON "Venue" ("coldScreenToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Venue_dessertScreenToken_key" ON "Venue" ("dessertScreenToken");

CREATE INDEX IF NOT EXISTS "PassSignal_deliveredAt_idx" ON "PassSignal" ("deliveredAt");
