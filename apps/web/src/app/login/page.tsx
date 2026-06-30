import type { Metadata } from "next";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { trialDayLabels } from "@/lib/trial-marketing";
import LoginPageClient from "./login-client";

export const metadata: Metadata = buildPrivatePageMetadata("Σύνδεση", "/login");

export default async function LoginPage() {
  const trialDays = await getTrialDaysFromCatalog();
  const { trialDaysGen } = trialDayLabels(trialDays);
  return <LoginPageClient trialDaysGen={trialDaysGen} />;
}
