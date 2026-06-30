import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { RootJsonLd } from "@/components/seo/json-ld";
import { I18nProvider } from "@/i18n/context";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { buildRootMetadata } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "greek"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = buildRootMetadata();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return (
    <html lang={locale} className={manrope.variable}>
      <body className="min-h-screen font-sans">
        <RootJsonLd />
        <I18nProvider initialLocale={locale} initialMessages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
