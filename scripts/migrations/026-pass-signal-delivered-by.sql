ALTER TABLE "PassSignal" ADD COLUMN IF NOT EXISTS "deliveredByStaffMemberId" TEXT;

CREATE INDEX IF NOT EXISTS "PassSignal_deliveredByStaffMemberId_idx"
  ON "PassSignal" ("deliveredByStaffMemberId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PassSignal_deliveredByStaffMemberId_fkey'
  ) THEN
    ALTER TABLE "PassSignal"
      ADD CONSTRAINT "PassSignal_deliveredByStaffMemberId_fkey"
      FOREIGN KEY ("deliveredByStaffMemberId") REFERENCES "VenueStaffMember"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
