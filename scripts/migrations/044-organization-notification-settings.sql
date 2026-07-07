-- Organization-level notification toggles (waiter calls, orders, voice).
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "notificationSettings" JSONB;
