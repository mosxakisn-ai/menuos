-- Department pass signals (kitchen/bar → waiter) + screen tokens
DO $$ BEGIN
  CREATE TYPE "PassStation" AS ENUM ('KITCHEN', 'BAR', 'COLD', 'DESSERT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PassSignalStatus" AS ENUM ('READY', 'PICKED_UP', 'DELIVERED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "kitchenScreenToken" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "barScreenToken" TEXT;

UPDATE "Venue"
SET "kitchenScreenToken" = gen_random_uuid()::text
WHERE "kitchenScreenToken" IS NULL;

UPDATE "Venue"
SET "barScreenToken" = gen_random_uuid()::text
WHERE "barScreenToken" IS NULL;

ALTER TABLE "Venue" ALTER COLUMN "kitchenScreenToken" SET NOT NULL;
ALTER TABLE "Venue" ALTER COLUMN "barScreenToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Venue_kitchenScreenToken_key" ON "Venue" ("kitchenScreenToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Venue_barScreenToken_key" ON "Venue" ("barScreenToken");

CREATE TABLE IF NOT EXISTS "PassSignal" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "station" "PassStation" NOT NULL,
  "tableNumber" TEXT,
  "roomNumber" TEXT,
  "sunbedNumber" TEXT,
  "message" VARCHAR(80),
  "status" "PassSignalStatus" NOT NULL DEFAULT 'READY',
  "readyAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pickedUpAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PassSignal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PassSignal_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PassSignal_venueId_status_idx" ON "PassSignal" ("venueId", "status");
