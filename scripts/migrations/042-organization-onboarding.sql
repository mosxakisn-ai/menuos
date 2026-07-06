-- Persist onboarding progress per organization (survives browser close).

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "onboardingQrAcknowledgedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "onboardingConfirmedAt" TIMESTAMP(3);
