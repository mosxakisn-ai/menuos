import type { Metadata, Viewport } from "next";
import { RootJsonLd } from "@/components/seo/json-ld";
import { VisitorIntentTracker } from "@/components/visitor-intent-tracker";
import { I18nProvider } from "@/i18n/context";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { manrope } from "@/lib/fonts";
import { buildRootMetadata } from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return buildRootMetadata(locale);
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  return (
    <html lang={locale} className={manrope.variable}>
      <body className="min-h-screen font-sans">
        <RootJsonLd />
        <I18nProvider initialLocale={locale} initialMessages={messages}>
          <VisitorIntentTracker />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
