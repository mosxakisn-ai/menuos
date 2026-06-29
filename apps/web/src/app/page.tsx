import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { HomeJsonLd } from "@/components/seo/marketing-json-ld";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata = seoPageMetadata(SEO_PAGES.home);

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeJsonLd />
      <SiteHeader />
      <main className="flex-1">
        <MarketingHome />
      </main>
      <SiteFooter />
    </div>
  );
}
