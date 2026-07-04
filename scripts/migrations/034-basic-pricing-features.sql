-- Basic pricing card bullets (public /pricing)
UPDATE "PlanCatalog"
SET
  "features" = '["1 κατάστημα","3 κατάλογοι","Απεριόριστα πιάτα","QR codes","Πολλαπλές γλώσσες","Απεριόριστα extra"]'::jsonb,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "plan" = 'BASIC';
