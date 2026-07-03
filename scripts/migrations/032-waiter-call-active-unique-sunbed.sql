-- Include sunbed in active-call uniqueness (008 omitted sunbedNumber).
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
