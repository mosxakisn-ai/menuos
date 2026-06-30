-- WaiterCall ORDER type + orderItems JSON (idempotent)

DO $$ BEGIN
  ALTER TYPE "WaiterCallType" ADD VALUE 'ORDER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "WaiterCall"
  ADD COLUMN IF NOT EXISTS "orderItems" JSONB;
