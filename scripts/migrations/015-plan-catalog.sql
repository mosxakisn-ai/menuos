CREATE TABLE IF NOT EXISTS "PlanCatalog" (
  "plan" "SubscriptionPlan" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "name" TEXT NOT NULL,
  "priceMonthly" DECIMAL(10,2) NOT NULL,
  "priceDisplay" TEXT,
  "periodLabel" TEXT NOT NULL DEFAULT '/μήνα',
  "description" TEXT,
  "features" JSONB NOT NULL DEFAULT '[]',
  "maxVenues" INTEGER NOT NULL,
  "maxMenusPerVenue" INTEGER,
  "maxItems" INTEGER,
  "ctaLabel" TEXT,
  "badge" TEXT,
  "highlighted" BOOLEAN NOT NULL DEFAULT false,
  "visibleOnPricing" BOOLEAN NOT NULL DEFAULT true,
  "trialDays" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanCatalog_pkey" PRIMARY KEY ("plan")
);

INSERT INTO "PlanCatalog" (
  "plan", "sortOrder", "name", "priceMonthly", "priceDisplay", "periodLabel", "description",
  "features", "maxVenues", "maxMenusPerVenue", "maxItems", "ctaLabel", "badge",
  "highlighted", "visibleOnPricing", "trialDays", "updatedAt"
) VALUES
(
  'TRIAL', 0, 'Δοκιμή', 0, '€0', ' / 7 ημέρες',
  'Για να δοκιμάσεις την πλατφόρμα πριν επιλέξεις πλάνο.',
  '["1 κατάστημα","1 κατάλογος","50 πιάτα","Πολλαπλές γλώσσες","Χωρίς κάρτα"]'::jsonb,
  1, 1, 50, 'Εγγραφή', NULL, false, true, 7, CURRENT_TIMESTAMP
),
(
  'BASIC', 1, 'Basic', 9.99, '€9.99', '/μήνα',
  'Ιδανικό για εστιατόριο, cafe ή μοναδικό κατάστημα.',
  '["1 κατάστημα","5 κατάλογοι","Απεριόριστα πιάτα","QR codes","Πολλαπλές γλώσσες","Απεριόριστα extra"]'::jsonb,
  1, 5, NULL, 'Ξεκίνα Basic', 'Δημοφιλές', true, true, NULL, CURRENT_TIMESTAMP
),
(
  'PRO', 2, 'Pro', 19.99, '€19.99', '/μήνα',
  'Για ξενοδοχεία και επιχειρήσεις με πολλαπλούς χώρους.',
  '["3 καταστήματα","Απεριόριστοι κατάλογοι","Κλήση σερβιτόρου","Πολλαπλές γλώσσες","Προτεραιότητα","PDF import"]'::jsonb,
  3, NULL, NULL, 'Ξεκίνα Pro', NULL, false, true, NULL, CURRENT_TIMESTAMP
),
(
  'ENTERPRISE', 3, 'Enterprise', 0, NULL, '/μήνα',
  'White-label, custom domain, πολλαπλά καταστήματα, προτεραιότητα υποστήριξης.',
  '["Δικό σας domain","White-label","Προτεραιότητα υποστήριξης"]'::jsonb,
  999, NULL, NULL, 'Ζήτησε προσφορά', NULL, false, false, NULL, CURRENT_TIMESTAMP
)
ON CONFLICT ("plan") DO NOTHING;
