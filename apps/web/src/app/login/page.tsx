import type { Metadata } from "next";
import { getServerLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/get-messages";
import { buildPrivatePageMetadata } from "@/lib/seo";import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { trialDaysForAuth } from "@/lib/trial-marketing";
import LoginPageClient from "./login-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  return buildPrivatePageMetadata(messages.pages.auth.login.submit, "/login");
}

export default async function LoginPage() {
  const locale = await getServerLocale();
  const trialDays = await getTrialDaysFromCatalog();
  const trialDaysLabel = trialDaysForAuth(locale, trialDays);
  return <LoginPageClient trialDaysGen={trialDaysLabel} />;
}
