-- Item labels for QR menu badges (idempotent)
DO $$ BEGIN
  CREATE TYPE "ItemLabel" AS ENUM ('OFFER', 'BEST', 'NEW');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "label" "ItemLabel";
