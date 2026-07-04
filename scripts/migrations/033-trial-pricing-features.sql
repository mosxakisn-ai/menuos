-- Trial pricing card bullets (public /pricing)
UPDATE "PlanCatalog"
SET
  "features" = '["1 κατάστημα","1 κατάλογος","50 πιάτα","Πολλαπλές γλώσσες","Χωρίς κάρτα"]'::jsonb,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "plan" = 'TRIAL';
