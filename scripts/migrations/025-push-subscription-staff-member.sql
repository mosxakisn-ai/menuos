-- Link push subscriptions to individual staff members (personal waiter links)

ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "staffMemberId" TEXT;

CREATE INDEX IF NOT EXISTS "PushSubscription_staffMemberId_idx" ON "PushSubscription" ("staffMemberId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_staffMemberId_fkey'
  ) THEN
    ALTER TABLE "PushSubscription"
      ADD CONSTRAINT "PushSubscription_staffMemberId_fkey"
      FOREIGN KEY ("staffMemberId") REFERENCES "VenueStaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
