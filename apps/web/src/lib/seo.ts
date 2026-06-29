import type { Metadata } from "next";
import { APP_NAME, APP_URL, SITE_DESCRIPTION } from "@/lib/config";

export function absoluteUrl(path = "/"): string {
  return new URL(path, APP_URL).toString();
}

export function openGraphImageUrl(): string {
  return absoluteUrl("/opengraph-image");
}

export function buildPageMetadata(options: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const description = options.description ?? SITE_DESCRIPTION;
  const path = options.path ?? "/";
  const url = absoluteUrl(path);

  return {
    title: options.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: options.title,
      description,
      url,
      siteName: APP_NAME,
      locale: "el_GR",
      type: "website",
      images: [
        {
          url: openGraphImageUrl(),
          width: 1200,
          height: 630,
          alt: APP_NAME,
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
      : { index: true, follow: true },
  };
}

export function buildRootMetadata(): Metadata {
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    ...buildPageMetadata({
      title: `${APP_NAME} — Premium QR Menu Platform`,
      description: SITE_DESCRIPTION,
    }),
    metadataBase: new URL(APP_URL),
    title: {
      default: `${APP_NAME} — Premium QR Menu Platform`,
      template: `%s | ${APP_NAME}`,
    },
    applicationName: APP_NAME,
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

export function buildPrivatePageMetadata(title: string, path: string): Metadata {
  return buildPageMetadata({ title, path, noIndex: true });
}
