import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SEO_HOME_FAQ, SEO_PAGES } from "@/content/seo-el";
import { marketingPageSchema } from "@/lib/seo-structured-data";

export function HomeJsonLd() {
  return (
    <JsonLdScript data={marketingPageSchema({ page: SEO_PAGES.home, faq: SEO_HOME_FAQ })} />
  );
}

export function MarketingPageJsonLd(props: {
  page: (typeof SEO_PAGES)[keyof typeof SEO_PAGES];
  faq?: readonly { q: string; a: string }[];
}) {
  return <JsonLdScript data={marketingPageSchema(props)} />;
}
