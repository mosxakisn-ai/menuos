-- Honest Trial vs Basic bullets + enforce Basic limits (5 catalogs, unlimited items)
UPDATE "PlanCatalog"
SET
  "features" = '["1 κατάστημα","1 κατάλογος","50 πιάτα","QR καταλόγου","Πολλαπλές γλώσσες","Χωρίς κάρτα"]'::jsonb,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "plan" = 'TRIAL';

UPDATE "PlanCatalog"
SET
  "features" = '["1 κατάστημα","5 κατάλογοι","Απεριόριστα πιάτα","QR καταλόγου","Πολλαπλές γλώσσες","Συνεχής λειτουργία — ανανέωση κάθε μήνα"]'::jsonb,
  "maxMenusPerVenue" = 5,
  "maxItems" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "plan" = 'BASIC';
