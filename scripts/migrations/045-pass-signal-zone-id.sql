-- KDS active zone when pass was sent (e.g. prefix:σαλα) — for waiter TTS/push location.
ALTER TABLE "PassSignal" ADD COLUMN IF NOT EXISTS "zoneId" VARCHAR(60);
