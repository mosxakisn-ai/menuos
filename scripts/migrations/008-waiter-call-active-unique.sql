-- One active (PENDING or ACKNOWLEDGED) call per venue + location + type
CREATE UNIQUE INDEX IF NOT EXISTS "WaiterCall_active_venue_location_type_key"
ON "WaiterCall" (
  "venueId",
  COALESCE("tableNumber", ''),
  COALESCE("roomNumber", ''),
  "type"
)
WHERE status IN ('PENDING', 'ACKNOWLEDGED');
