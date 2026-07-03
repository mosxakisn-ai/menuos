import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
  buildWebSiteSchema,
} from "@/lib/seo-structured-data";
import { getCatalogOfferBounds } from "@/lib/plan-pricing-marketing";

export async function RootJsonLd() {
  const bounds = await getCatalogOfferBounds();
  return (
    <JsonLdScript
      data={[
        buildOrganizationSchema(),
        buildWebSiteSchema(),
        buildSoftwareApplicationSchema(bounds),
      ]}
    />
  );
}
