import type { Metadata } from "next";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { parseRegisterPlanIntent } from "@/lib/register-plan-intent";
import { trialDayLabels } from "@/lib/trial-marketing";
import RegisterPageClient from "./register-client";

export const metadata: Metadata = buildPrivatePageMetadata("Εγγραφή", "/register");

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const trialDays = await getTrialDaysFromCatalog();
  const { trialDaysGen } = trialDayLabels(trialDays);
  const planIntent = parseRegisterPlanIntent(sp.plan);
  return <RegisterPageClient trialDaysGen={trialDaysGen} planIntent={planIntent} />;
}
