import { SEO_BLOG_POSTS, SEO_BLOG_INDEX } from "@/content/seo-blog";
import { SEO_PAGES, SEO_SITE } from "@/content/seo-el";
import { formatPlanPriceDisplay, getTrialDaysFromCatalog, listPlanCatalogEntriesSafe } from "@/lib/plan-catalog-service";
import { getAllSeoLandingPaths } from "@/lib/seo-landing";
import { absoluteUrl } from "@/lib/seo";
import { trialDayLabels } from "@/lib/trial-marketing";

export async function GET() {
  const trialDays = await getTrialDaysFromCatalog();
  const { trialDaysGen } = trialDayLabels(trialDays);
  const catalog = await listPlanCatalogEntriesSafe({ fresh: true });
  const basic = catalog.find((e) => e.id === "BASIC");
  const pro = catalog.find((e) => e.id === "PRO");
  const basicPrice = basic ? formatPlanPriceDisplay(basic.priceMonthly, basic.priceDisplay) : "€9.99";
  const proPrice = pro ? formatPlanPriceDisplay(pro.priceMonthly, pro.priceDisplay) : "€19.99";
  const staticPages = Object.values(SEO_PAGES).map((p) => absoluteUrl(p.path));
  const landings = getAllSeoLandingPaths().map((path) => absoluteUrl(path));
  const blogPosts = SEO_BLOG_POSTS.map((post) => absoluteUrl(`/blog/${post.slug}`));

  const lines = [
    `# ${SEO_SITE.name} (${SEO_SITE.url.replace("https://", "")})`,
    "",
    "> Ψηφιακό menu με QR και Live 360° συντονισμό για εστιατόρια, ξενοδοχεία και bars στην Ελλάδα.",
    "",
    "## Τι κάνουμε",
    "- Online πλατφόρμα για ψηφιακό menu με QR codes",
    "- MenuOS Live · 360° — live συντονισμός κλήσεων και παραγγελιών από QR",
    "- Πολυγλωσσικό QR menu (Ελληνικά, English, Deutsch, Français)",
    "- Online διαχείριση για ενημέρωση τιμών και πιάτων",
    "- Κλήση σερβιτόρου / room service από το menu",
    `- Δωρεάν δοκιμή ${trialDaysGen}`,
    `- Τιμές: Basic ${basicPrice}/μήνα, Pro ${proPrice}/μήνα (Live 360° included)`,
    "",
    "## Κύριες σελίδες",
    ...staticPages.map((url) => `- ${url}`),
    "",
    `## SEO landings (${landings.length})`,
    ...landings.slice(0, 40).map((url) => `- ${url}`),
    ...(landings.length > 40 ? [`- … και ${landings.length - 40} ακόμα (δείτε sitemap)`] : []),
    "",
    "## Blog",
    `- ${absoluteUrl(SEO_BLOG_INDEX.path)}`,
    ...blogPosts.map((url) => `- ${url}`),
    "",
    "## SEO",
    `- Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "- English UI: append ?lang=en to any marketing URL",
    "- Guest QR menus: 4 languages (EL, EN, DE, FR)",
    "",
    "## Επικοινωνία",
    `- Τηλέφωνο: ${SEO_SITE.contactPhone}`,
    `- Email: ${SEO_SITE.contactEmail}`,
    `- Facebook: ${SEO_SITE.contactFacebook}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
