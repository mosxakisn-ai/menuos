-- Venue operations config (enabled departments, quick chips, map labels, zones)
ALTER TABLE "VenueSetting" ADD COLUMN IF NOT EXISTS "operationsConfig" JSONB;

ALTER TABLE "VenueStationScreen" ADD COLUMN IF NOT EXISTS "quickChips" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
