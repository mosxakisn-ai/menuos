-- WaiterCall.type distinguishes «κλήση σερβιτόρου» vs «λογαριασμός» (idempotent)

DO $$ BEGIN
  CREATE TYPE "WaiterCallType" AS ENUM ('WAITER', 'BILL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "WaiterCall"
  ADD COLUMN IF NOT EXISTS "type" "WaiterCallType" NOT NULL DEFAULT 'WAITER';
