import type { Metadata } from "next";
import { SEO_PAGES, SEO_SITE, type SeoPageDef } from "@/content/seo-el";
import { SEO_PAGES_EN, SEO_SITE_EN } from "@/content/seo-en";
import { getServerLocale } from "@/i18n/server";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { applyTrialDayPlaceholdersDeep } from "@/lib/trial-marketing";
import { APP_NAME, APP_URL, SITE_DESCRIPTION } from "@/lib/config";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/types";

export function absoluteUrl(path = "/"): string {
  return new URL(path, APP_URL).toString();
}

export function openGraphImageUrl(): string {
  return absoluteUrl("/opengraph-image");
}

function mergeKeywords(pageKeywords?: string[]): string[] {
  const base = [...SEO_SITE.keywords];
  if (!pageKeywords?.length) return base;
  return [...new Set([...pageKeywords, ...base])];
}

/** Locale alternates — default site language is English (cookie overrides per visit). */
export function buildHreflangAlternates(path = "/"): NonNullable<Metadata["alternates"]> {
  const canonical = absoluteUrl(path);
  const elUrl = `${canonical}?lang=el`;
  const enUrl = `${canonical}?lang=en`;
  const defaultIsEn = DEFAULT_LOCALE === "en";
  return {
    canonical,
    languages: {
      "el-GR": defaultIsEn ? elUrl : canonical,
      en: defaultIsEn ? canonical : enUrl,
      "x-default": defaultIsEn ? canonical : enUrl,
    },
  };
}

export function buildPageMetadata(options: {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const description = options.description ?? SITE_DESCRIPTION;
  const path = options.path ?? "/";
  const url = absoluteUrl(path);
  const keywords = mergeKeywords(options.keywords);

  return {
    title: options.title,
    description,
    keywords,
    alternates: buildHreflangAlternates(path),
    openGraph: {
      title: options.title,
      description,
      url,
      siteName: APP_NAME,
      locale: SEO_SITE.locale,
      alternateLocale: ["en_US"],
      type: "website",
      images: [
        {
          url: openGraphImageUrl(),
          width: 1200,
          height: 630,
          alt: `${APP_NAME} — ${description.slice(0, 80)}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description,
      images: [openGraphImageUrl()],
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    other: {
      "geo.region": SEO_SITE.region,
      "content-language": SEO_SITE.language,
    },
  };
}

export function buildRootMetadata(locale: Locale = DEFAULT_LOCALE): Metadata {
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
  const isEn = locale === "en";
  const title = isEn ? SEO_SITE_EN.defaultTitle : SEO_SITE.defaultTitle;
  const description = isEn ? SEO_SITE_EN.description : SITE_DESCRIPTION;

  const base = buildPageMetadata({
    title,
    description,
    path: "/",
    keywords: [...SEO_SITE.keywords],
  });

  return {
    ...base,
    metadataBase: new URL(APP_URL),
    title: {
      default: title,
      template: SEO_SITE.titleTemplate,
    },
    openGraph: {
      ...base.openGraph,
      locale: isEn ? SEO_SITE_EN.locale : SEO_SITE.locale,
      alternateLocale: isEn ? ["el_GR"] : ["en_US"],
    },
    other: {
      "geo.region": SEO_SITE.region,
      "content-language": isEn ? SEO_SITE_EN.language : SEO_SITE.language,
    },
    applicationName: APP_NAME,
    authors: [{ name: APP_NAME, url: APP_URL }],
    creator: APP_NAME,
    publisher: APP_NAME,
    category: "technology",
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

export function buildPrivatePageMetadata(title: string, path: string): Metadata {
  return buildPageMetadata({ title, path, noIndex: true });
}

export function seoPageMetadata(page: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    keywords: page.keywords ? [...page.keywords] : undefined,
  });
}

type MarketingSeoPageKey = keyof typeof SEO_PAGES;

function marketingSeoPage(key: MarketingSeoPageKey, locale: "el" | "en"): SeoPageDef {
  if (locale === "en") {
    const en = SEO_PAGES_EN[key];
    const el = SEO_PAGES[key];
    return {
      title: en.title,
      description: en.description,
      path: en.path,
      breadcrumbLabel: en.breadcrumbLabel,
      ...("keywords" in el && el.keywords ? { keywords: [...el.keywords] } : {}),
    };
  }
  return SEO_PAGES[key];
}

async function marketingSeoPageEl(key: MarketingSeoPageKey): Promise<SeoPageDef> {
  const trialDays = await getTrialDaysFromCatalog();
  return applyTrialDayPlaceholdersDeep(SEO_PAGES[key], trialDays);
}

/** Locale-aware metadata for marketing pages (cookie or ?lang=en). */
export async function generateMarketingMetadata(key: MarketingSeoPageKey): Promise<Metadata> {
  const locale = await getServerLocale();
  const page = locale === "en" ? marketingSeoPage(key, locale) : await marketingSeoPageEl(key);
  const meta = seoPageMetadata(page);

  if (locale !== "en") return meta;

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      locale: SEO_SITE_EN.locale,
    },
    other: {
      "geo.region": SEO_SITE.region,
      "content-language": SEO_SITE_EN.language,
    },
  };
}
