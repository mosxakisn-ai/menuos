import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { HomeJsonLd } from "@/components/seo/marketing-json-ld";
import { generateMarketingMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return generateMarketingMetadata("home");
}

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
