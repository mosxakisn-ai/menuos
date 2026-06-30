-- Venue spots registry + sunbed location on waiter calls
ALTER TABLE "WaiterCall" ADD COLUMN IF NOT EXISTS "sunbedNumber" TEXT;

DO $$ BEGIN
  CREATE TYPE "VenueSpotType" AS ENUM ('TABLE', 'ROOM', 'SUNBED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "VenueSpot" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "type" "VenueSpotType" NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueSpot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VenueSpot_venueId_type_label_key"
  ON "VenueSpot" ("venueId", "type", "label");

CREATE INDEX IF NOT EXISTS "VenueSpot_venueId_sortOrder_idx"
  ON "VenueSpot" ("venueId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "VenueSpot"
    ADD CONSTRAINT "VenueSpot_venueId_fkey"
    FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Include sunbed in active-call uniqueness (was table+room only in 008)
DROP INDEX IF EXISTS "WaiterCall_active_venue_location_type_key";

CREATE UNIQUE INDEX IF NOT EXISTS "WaiterCall_active_venue_location_type_key"
ON "WaiterCall" (
  "venueId",
  COALESCE("tableNumber", ''),
  COALESCE("roomNumber", ''),
  COALESCE("sunbedNumber", ''),
  "type"
)
WHERE status IN ('PENDING', 'ACKNOWLEDGED');
