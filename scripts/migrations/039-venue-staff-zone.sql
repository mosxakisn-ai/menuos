-- Staff member assigned space (waiter panel zone filter)

ALTER TABLE "VenueStaffMember"
  ADD COLUMN IF NOT EXISTS "zoneId" VARCHAR(60);
