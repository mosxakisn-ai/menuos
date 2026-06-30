ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "trialMidEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "trialEndingEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "trialExpiredEmailSentAt" TIMESTAMP(3);
