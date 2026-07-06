CREATE TABLE IF NOT EXISTS "VisitorIntentSession" (
  "sessionId" VARCHAR(64) PRIMARY KEY,
  "surface" VARCHAR(20) NOT NULL,
  "step" VARCHAR(32) NOT NULL,
  "path" VARCHAR(200),
  "planId" VARCHAR(20),
  "visitorLabel" VARCHAR(120),
  "clientIp" VARCHAR(45),
  "ipCity" VARCHAR(80),
  "ipCountry" VARCHAR(80),
  "referrer" VARCHAR(200),
  "source" VARCHAR(20) NOT NULL DEFAULT 'web',
  "status" VARCHAR(12) NOT NULL DEFAULT 'online',
  "stepSince" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "leftAt" TIMESTAMPTZ,
  "stepTrail" JSONB
);

CREATE INDEX IF NOT EXISTS "VisitorIntentSession_lastSeenAt_idx"
  ON "VisitorIntentSession" ("lastSeenAt");

CREATE INDEX IF NOT EXISTS "VisitorIntentSession_status_lastSeenAt_idx"
  ON "VisitorIntentSession" ("status", "lastSeenAt");

CREATE INDEX IF NOT EXISTS "VisitorIntentSession_firstSeenAt_idx"
  ON "VisitorIntentSession" ("firstSeenAt");

CREATE INDEX IF NOT EXISTS "VisitorIntentSession_surface_lastSeenAt_idx"
  ON "VisitorIntentSession" ("surface", "lastSeenAt");
