-- Client diagnostic reports for MenuOS Ops Help Desk (idempotent)

DO $$ BEGIN
  CREATE TYPE "DiagnosticSeverity" AS ENUM ('INFO', 'WARN', 'ERROR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DiagnosticStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ClientDiagnosticReport" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "userId" TEXT,
  "userEmail" TEXT,
  "severity" "DiagnosticSeverity" NOT NULL DEFAULT 'ERROR',
  "status" "DiagnosticStatus" NOT NULL DEFAULT 'OPEN',
  "source" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "errorCode" TEXT,
  "stack" TEXT,
  "context" JSONB,
  "fingerprint" TEXT NOT NULL,
  "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "internalNote" TEXT,
  CONSTRAINT "ClientDiagnosticReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientDiagnosticReport_organizationId_status_lastSeenAt_idx"
  ON "ClientDiagnosticReport"("organizationId", "status", "lastSeenAt");

CREATE INDEX IF NOT EXISTS "ClientDiagnosticReport_status_lastSeenAt_idx"
  ON "ClientDiagnosticReport"("status", "lastSeenAt");

CREATE INDEX IF NOT EXISTS "ClientDiagnosticReport_fingerprint_status_idx"
  ON "ClientDiagnosticReport"("fingerprint", "status");

DO $$ BEGIN
  ALTER TABLE "ClientDiagnosticReport"
    ADD CONSTRAINT "ClientDiagnosticReport_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ClientDiagnosticReport"
    ADD CONSTRAINT "ClientDiagnosticReport_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
