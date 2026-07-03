import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { getServerLocale } from "@/i18n/server";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { buildPageMetadata } from "@/lib/seo";
import { getSeoLandingCopy } from "@/lib/seo-landing-content";
import {
  getAllSeoLandingSlugParams,
  resolveSeoLandingFromSlug,
} from "@/lib/seo-landing";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  return getAllSeoLandingSlugParams().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = resolveSeoLandingFromSlug(slug);
  if (!config) notFound();

  const locale = await getServerLocale();
  const trialDays = await getTrialDaysFromCatalog();
  const copy = getSeoLandingCopy(config, locale, trialDays);

  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: config.path,
    keywords: copy.keywords,
    locale,
  });
}

export default async function SeoLandingRoutePage({ params }: Props) {
  const { slug } = await params;
  const config = resolveSeoLandingFromSlug(slug);
  if (!config) notFound();

  return <SeoLandingPage config={config} />;
}
