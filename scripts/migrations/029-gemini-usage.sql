-- Gemini token tracking (PlanCatalog limits, org override, usage events)

ALTER TABLE "PlanCatalog" ADD COLUMN IF NOT EXISTS "maxGeminiTokensPerMonth" INTEGER;

UPDATE "PlanCatalog"
SET "maxGeminiTokensPerMonth" = 0
WHERE "plan" IN ('TRIAL', 'BASIC') AND "maxGeminiTokensPerMonth" IS NULL;

UPDATE "PlanCatalog"
SET "maxGeminiTokensPerMonth" = 500000
WHERE "plan" = 'PRO' AND "maxGeminiTokensPerMonth" IS NULL;

UPDATE "PlanCatalog"
SET "maxGeminiTokensPerMonth" = NULL
WHERE "plan" = 'ENTERPRISE' AND "maxGeminiTokensPerMonth" IS NULL;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "geminiTokenLimitOverride" INTEGER;

CREATE TABLE IF NOT EXISTS "GeminiUsageEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "success" BOOLEAN NOT NULL,
  "httpStatus" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeminiUsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GeminiUsageEvent_organizationId_createdAt_idx"
  ON "GeminiUsageEvent" ("organizationId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GeminiUsageEvent_organizationId_fkey'
  ) THEN
    ALTER TABLE "GeminiUsageEvent"
      ADD CONSTRAINT "GeminiUsageEvent_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
