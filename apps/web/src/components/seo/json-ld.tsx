import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
  buildWebSiteSchema,
} from "@/lib/seo-structured-data";

export function RootJsonLd() {
  return (
    <JsonLdScript
      data={[buildOrganizationSchema(), buildWebSiteSchema(), buildSoftwareApplicationSchema()]}
    />
  );
}
