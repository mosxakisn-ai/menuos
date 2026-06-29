import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { MarketingHome } from "@/components/marketing/marketing-home";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <MarketingHome />
      </main>
      <SiteFooter />
    </div>
  );
}
