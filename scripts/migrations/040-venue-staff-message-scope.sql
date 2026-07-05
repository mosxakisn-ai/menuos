-- Staff member message set (from Ρυθμίσεις → Μηνύματα)

ALTER TABLE "VenueStaffMember"
  ADD COLUMN IF NOT EXISTS "messageScope" VARCHAR(40);
