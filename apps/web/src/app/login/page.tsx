import type { Metadata } from "next";
import { getServerLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/get-messages";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { trialDayLabels } from "@/lib/trial-marketing";
import LoginPageClient from "./login-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  return buildPrivatePageMetadata(messages.pages.auth.login.submit, "/login");
}

export default async function LoginPage() {
  const trialDays = await getTrialDaysFromCatalog();
  const { trialDaysGen } = trialDayLabels(trialDays);
  return <LoginPageClient trialDaysGen={trialDaysGen} />;
}
