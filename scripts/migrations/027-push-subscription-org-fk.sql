-- Link push subscriptions to organizations (orphan cleanup + FK)
DELETE FROM "PushSubscription" ps
WHERE NOT EXISTS (SELECT 1 FROM "Organization" o WHERE o.id = ps."organizationId");

DO $$ BEGIN
  ALTER TABLE "PushSubscription"
    ADD CONSTRAINT "PushSubscription_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
