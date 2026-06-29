import { JsonLdScript } from "@/components/seo/json-ld-script";
import { APP_NAME, APP_URL, SITE_DESCRIPTION } from "@/lib/config";
import { absoluteUrl } from "@/lib/seo";

export function RootJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: APP_URL,
    logo: absoluteUrl("/icon.png"),
    description: SITE_DESCRIPTION,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: APP_URL,
    description: SITE_DESCRIPTION,
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "29",
      priceCurrency: "EUR",
    },
  };

  return <JsonLdScript data={[organization, website, software]} />;
}
