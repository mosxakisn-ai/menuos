import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { SiteFooterSeoHub } from "@/components/seo/site-footer-seo-hub";
import { HomeJsonLd } from "@/components/seo/marketing-json-ld";
import { homepageHasNonCanonicalParams, type HomepageSearchParams } from "@/lib/homepage-seo";
import { generateMarketingMetadata } from "@/lib/seo";

type HomePageProps = {
  searchParams: Promise<HomepageSearchParams>;
};

export async function generateMetadata({ searchParams }: HomePageProps) {
  const params = await searchParams;
  return generateMarketingMetadata("home", {
    noIndex: homepageHasNonCanonicalParams(params),
  });
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeJsonLd />
      <SiteHeader />
      <main className="flex-1">
        <MarketingHome />
      </main>
      <SiteFooter seoHub={<SiteFooterSeoHub />} />
    </div>
  );
}
