-- Remember KDS-selected push recipients for automatic re-push.

ALTER TABLE "PassSignal"
  ADD COLUMN IF NOT EXISTS "notifyStaffMemberIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
