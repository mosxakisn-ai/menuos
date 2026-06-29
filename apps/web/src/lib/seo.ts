import type { Metadata } from "next";
import { SEO_SITE } from "@/content/seo-el";
import { APP_NAME, APP_URL, SITE_DESCRIPTION } from "@/lib/config";

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
    alternates: {
      canonical: url,
      languages: {
        "el-GR": url,
        "x-default": url,
      },
    },
    openGraph: {
      title: options.title,
      description,
      url,
      siteName: APP_NAME,
      locale: SEO_SITE.locale,
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

export function buildRootMetadata(): Metadata {
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    ...buildPageMetadata({
      title: SEO_SITE.defaultTitle,
      description: SITE_DESCRIPTION,
      path: "/",
      keywords: [...SEO_SITE.keywords],
    }),
    metadataBase: new URL(APP_URL),
    title: {
      default: SEO_SITE.defaultTitle,
      template: SEO_SITE.titleTemplate,
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
