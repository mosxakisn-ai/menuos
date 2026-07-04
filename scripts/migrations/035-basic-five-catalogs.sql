-- Basic: 5 catalogs (pricing card + plan limit)
UPDATE "PlanCatalog"
SET
  "features" = '["1 κατάστημα","5 κατάλογοι","Απεριόριστα πιάτα","QR codes","Πολλαπλές γλώσσες","Απεριόριστα extra"]'::jsonb,
  "maxMenusPerVenue" = 5,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "plan" = 'BASIC';
