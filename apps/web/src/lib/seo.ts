import type { Metadata } from "next";
import { SEO_PAGES, SEO_SITE, type SeoPageDef } from "@/content/seo-el";
import { SEO_PAGES_EN, SEO_SITE_EN } from "@/content/seo-en";
import { getServerLocale } from "@/i18n/server";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/types";
import { applyCatalogMarketingPlaceholdersDeep } from "@/lib/plan-pricing-marketing";
import { APP_NAME, APP_URL, SITE_DESCRIPTION } from "@/lib/config";

export const SEO_BILINGUAL_LOCALES: Locale[] = ["el", "en"];

const HREFLANG_CODES: Record<Locale, string> = {
  el: "el",
  en: "en",
};

const OG_LOCALE: Record<Locale, string> = {
  el: "el_GR",
  en: "en_US",
};

export function absoluteUrl(path = "/"): string {
  return new URL(path, APP_URL).toString();
}

export function openGraphImageUrl(locale: Locale = DEFAULT_LOCALE): string {
  const path =
    locale === DEFAULT_LOCALE ? "/opengraph-image" : `/opengraph-image?lang=${locale}`;
  return absoluteUrl(path);
}

function mergeKeywords(pageKeywords?: string[]): string[] {
  const base = [...SEO_SITE.keywords];
  if (!pageKeywords?.length) return base;
  return [...new Set([...pageKeywords, ...base])];
}

function googleSiteVerification(): Metadata["verification"] | undefined {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return token ? { google: token } : undefined;
}

/** hreflang alternates — default locale uses clean URL; others use ?lang=. */
export function buildHreflangAlternates(
  path = "/",
  locales: readonly Locale[] = SEO_BILINGUAL_LOCALES,
): NonNullable<Metadata["alternates"]> {
  const normalizedPath = path === "" ? "/" : path;
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    const url = new URL(normalizedPath, APP_URL);
    if (locale !== DEFAULT_LOCALE) {
      url.searchParams.set("lang", locale);
    }
    languages[HREFLANG_CODES[locale]] = url.toString();
  }
  languages["x-default"] = absoluteUrl(normalizedPath);

  return {
    canonical: absoluteUrl(normalizedPath),
    languages,
  };
}

export function buildPageMetadata(
  options: {
    title: string;
    description?: string;
    path?: string;
    keywords?: string[];
    noIndex?: boolean;
    locale?: Locale;
    hreflangLocales?: readonly Locale[];
  },
): Metadata {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const description = options.description ?? SITE_DESCRIPTION;
  const path = options.path ?? "/";
  const url = absoluteUrl(path);
  const keywords = mergeKeywords(options.keywords);
  const verification = !options.noIndex ? googleSiteVerification() : undefined;
  const hreflangLocales = options.hreflangLocales ?? SEO_BILINGUAL_LOCALES;
  const isEn = locale === "en";
  const siteName = APP_NAME;

  return {
    title: options.title,
    description,
    keywords,
    alternates: options.noIndex
      ? { canonical: url }
      : buildHreflangAlternates(path, hreflangLocales),
    ...(verification ? { verification } : {}),
    openGraph: {
      title: options.title,
      description,
      url,
      siteName,
      locale: OG_LOCALE[locale],
      alternateLocale: hreflangLocales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      type: "website",
      images: [
        {
          url: openGraphImageUrl(locale),
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
      images: [openGraphImageUrl(locale)],
    },
    robots: options.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
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
      "content-language": isEn ? SEO_SITE_EN.language : SEO_SITE.language,
    },
  };
}

export function buildRootMetadata(locale: Locale = DEFAULT_LOCALE): Metadata {
  const isEn = locale === "en";
  const title = isEn ? SEO_SITE_EN.defaultTitle : SEO_SITE.defaultTitle;
  const description = isEn ? SEO_SITE_EN.description : SITE_DESCRIPTION;
  const googleVerification = googleSiteVerification();

  const { alternates: _rootAlternates, ...page } = buildPageMetadata({
    title,
    description,
    path: "/",
    keywords: [...SEO_SITE.keywords],
    locale,
  });

  return {
    ...page,
    metadataBase: new URL(APP_URL),
    title: {
      default: title,
      template: SEO_SITE.titleTemplate,
    },
    openGraph: {
      ...page.openGraph,
      locale: OG_LOCALE[locale],
      alternateLocale: SEO_BILINGUAL_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
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
    icons: {
      icon: [{ url: "/icon", type: "image/png" }],
      apple: [{ url: "/apple-icon", type: "image/png" }],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    ...(googleVerification ? { verification: googleVerification } : {}),
  };
}

export function buildPrivatePageMetadata(title: string, path: string): Metadata {
  return buildPageMetadata({ title, path, noIndex: true });
}

export function seoPageMetadata(
  page: {
    title: string;
    description: string;
    path: string;
    keywords?: string[];
  },
  locale: Locale = DEFAULT_LOCALE,
  noIndex?: boolean,
): Metadata {
  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    keywords: page.keywords ? [...page.keywords] : undefined,
    locale,
    noIndex,
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
  return applyCatalogMarketingPlaceholdersDeep(SEO_PAGES[key], "el");
}

/** Locale-aware metadata for marketing pages (cookie or ?lang=en). */
export async function generateMarketingMetadata(
  key: MarketingSeoPageKey,
  options?: { noIndex?: boolean },
): Promise<Metadata> {
  const locale = await getServerLocale();
  const page =
    locale === "en"
      ? await applyCatalogMarketingPlaceholdersDeep(marketingSeoPage(key, locale), "en")
      : await marketingSeoPageEl(key);
  return seoPageMetadata(page, locale, options?.noIndex);
}
