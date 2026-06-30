import type { Metadata } from "next";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { trialDayLabels } from "@/lib/trial-marketing";
import RegisterPageClient from "./register-client";

export const metadata: Metadata = buildPrivatePageMetadata("Εγγραφή", "/register");

export default async function RegisterPage() {
  const trialDays = await getTrialDaysFromCatalog();
  const { trialDaysGen } = trialDayLabels(trialDays);
  return <RegisterPageClient trialDaysGen={trialDaysGen} />;
}
