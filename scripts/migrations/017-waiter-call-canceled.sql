-- WaiterCallStatus.CANCELED (guest cancel) — idempotent for older DBs created before this value existed.
DO $$
BEGIN
  ALTER TYPE "WaiterCallStatus" ADD VALUE 'CANCELED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
