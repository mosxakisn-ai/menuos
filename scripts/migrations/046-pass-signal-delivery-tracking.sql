-- Pass signal delivery tracking: push stats, seen ack, repush, picked-up by.

ALTER TABLE "PassSignal"
  ADD COLUMN IF NOT EXISTS "firstSeenAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "seenByStaffMemberId" TEXT,
  ADD COLUMN IF NOT EXISTS "pickedUpByStaffMemberId" TEXT,
  ADD COLUMN IF NOT EXISTS "pushSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "pushTargetCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "pushSentCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "pushFailedCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "repushCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastRepushAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PassSignal_seenByStaffMemberId_fkey'
  ) THEN
    ALTER TABLE "PassSignal"
      ADD CONSTRAINT "PassSignal_seenByStaffMemberId_fkey"
      FOREIGN KEY ("seenByStaffMemberId") REFERENCES "VenueStaffMember"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PassSignal_pickedUpByStaffMemberId_fkey'
  ) THEN
    ALTER TABLE "PassSignal"
      ADD CONSTRAINT "PassSignal_pickedUpByStaffMemberId_fkey"
      FOREIGN KEY ("pickedUpByStaffMemberId") REFERENCES "VenueStaffMember"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PassSignal_firstSeenAt_idx" ON "PassSignal" ("firstSeenAt");
CREATE INDEX IF NOT EXISTS "PassSignal_seenByStaffMemberId_idx" ON "PassSignal" ("seenByStaffMemberId");
