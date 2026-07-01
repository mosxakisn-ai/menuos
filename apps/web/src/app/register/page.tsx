import type { Metadata } from "next";
import { getServerLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/get-messages";import { buildPrivatePageMetadata } from "@/lib/seo";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { parseRegisterPlanIntent } from "@/lib/register-plan-intent";
import { trialDaysForAuth } from "@/lib/trial-marketing";
import RegisterPageClient from "./register-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  return buildPrivatePageMetadata(messages.pages.auth.register.title, "/register");
}

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = await getServerLocale();
  const trialDays = await getTrialDaysFromCatalog();
  const trialDaysLabel = trialDaysForAuth(locale, trialDays);
  const planIntent = parseRegisterPlanIntent(sp.plan);
  return <RegisterPageClient trialDaysGen={trialDaysLabel} planIntent={planIntent} />;
}
