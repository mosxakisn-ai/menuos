-- Secret link token per venue — staff panel without login
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "staffToken" TEXT;

UPDATE "Venue"
SET "staffToken" = gen_random_uuid()::text
WHERE "staffToken" IS NULL;

ALTER TABLE "Venue" ALTER COLUMN "staffToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Venue_staffToken_key" ON "Venue" ("staffToken");

-- Push subscriptions from staff devices (no user account)
ALTER TABLE "PushSubscription" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "venueId" TEXT;

CREATE INDEX IF NOT EXISTS "PushSubscription_venueId_idx" ON "PushSubscription" ("venueId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_venueId_fkey'
  ) THEN
    ALTER TABLE "PushSubscription"
      ADD CONSTRAINT "PushSubscription_venueId_fkey"
      FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
