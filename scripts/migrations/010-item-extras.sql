-- Per-item customer extras (e.g. "χωρίς αλάτι", "λίγη ζάχαρη")
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "extras" JSONB;
