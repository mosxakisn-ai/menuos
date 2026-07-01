-- Venue staff roster (names + departments — no per-person login yet)

CREATE TABLE IF NOT EXISTS "VenueStaffMember" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "roleLabel" TEXT NOT NULL,
  "stations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueStaffMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VenueStaffMember_venueId_sortOrder_idx"
  ON "VenueStaffMember" ("venueId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VenueStaffMember_venueId_fkey'
  ) THEN
    ALTER TABLE "VenueStaffMember"
      ADD CONSTRAINT "VenueStaffMember_venueId_fkey"
      FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
