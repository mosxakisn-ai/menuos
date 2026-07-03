import type { Metadata } from "next";
import { getServerLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/get-messages";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { trialDaysForAuth } from "@/lib/trial-marketing";
import { safeDashboardCallbackUrl } from "@/lib/safe-callback-url";
import LoginPageClient from "./login-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  return buildPrivatePageMetadata(messages.pages.auth.login.submit, "/login");
}

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const trialDays = await getTrialDaysFromCatalog();
  const trialDaysLabel = trialDaysForAuth(locale, trialDays);
  const { callbackUrl } = await searchParams;
  return (
    <LoginPageClient
      trialDaysGen={trialDaysLabel}
      callbackUrl={safeDashboardCallbackUrl(callbackUrl)}
    />
  );
}
