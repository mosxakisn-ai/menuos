import { SEO_BLOG_POSTS, SEO_BLOG_INDEX } from "@/content/seo-blog";
import { SEO_PAGES, SEO_SITE } from "@/content/seo-el";
import { formatPlanPriceDisplay, getTrialDaysFromCatalog, listPlanCatalogEntriesSafe } from "@/lib/plan-catalog-service";
import { getAllSeoLandingPaths } from "@/lib/seo-landing";
import { absoluteUrl } from "@/lib/seo";
import { trialDayLabels } from "@/lib/trial-marketing";

function mdLink(label: string, path: string): string {
  return `- [${label}](${absoluteUrl(path)})`;
}

export async function GET() {
  const trialDays = await getTrialDaysFromCatalog();
  const { trialDaysGen } = trialDayLabels(trialDays);
  const catalog = await listPlanCatalogEntriesSafe({ fresh: true });
  const basic = catalog.find((e) => e.id === "BASIC");
  const pro = catalog.find((e) => e.id === "PRO");
  const basicPrice = basic ? formatPlanPriceDisplay(basic.priceMonthly, basic.priceDisplay) : "€9.99";
  const proPrice = pro ? formatPlanPriceDisplay(pro.priceMonthly, pro.priceDisplay) : "€19.99";
  const staticPages = Object.values(SEO_PAGES);
  const landings = getAllSeoLandingPaths();
  const blogPosts = SEO_BLOG_POSTS;

  const lines = [
    `# ${SEO_SITE.name}`,
    "",
    `> Ψηφιακό menu με QR και Live 360° συντονισμό για εστιατόρια, ξενοδοχεία και bars στην Ελλάδα.`,
    "",
    `Website: ${SEO_SITE.url}`,
    "",
    "## Τι κάνουμε",
    "- Online πλατφόρμα για ψηφιακό menu με QR codes",
    "- [MenuOS Live · 360°](https://menuos.gr/live-360) — live συντονισμός κλήσεων και παραγγελιών από QR",
    "- Πολυγλωσσικό QR menu (Ελληνικά, English, Deutsch, Français)",
    "- Online διαχείριση για ενημέρωση τιμών και πιάτων",
    "- Κλήση σερβιτόρου / room service από το menu",
    `- Δωρεάν δοκιμή ${trialDaysGen}`,
    `- Τιμές: [Basic ${basicPrice}/μήνα](https://menuos.gr/pricing), [Pro ${proPrice}/μήνα](https://menuos.gr/pricing)`,
    "",
    "## Κύριες σελίδες",
    ...staticPages.map((p) => mdLink(p.breadcrumbLabel, p.path)),
    "",
    `## SEO landings (${landings.length})`,
    ...landings.slice(0, 40).map((path) => mdLink(path.replace(/^\//, ""), path)),
    ...(landings.length > 40
      ? [`- [Full sitemap](${absoluteUrl("/sitemap.xml")}) — ${landings.length} landing URLs`]
      : []),
    "",
    "## Blog",
    mdLink(SEO_BLOG_INDEX.breadcrumbLabel, SEO_BLOG_INDEX.path),
    ...blogPosts.map((post) => mdLink(post.title, `/blog/${post.slug}`)),
    "",
    "## SEO & discovery",
    `- [Sitemap](${absoluteUrl("/sitemap.xml")})`,
    `- [Image sitemap](${absoluteUrl("/sitemap-images.xml")})`,
    `- [RSS feed](${absoluteUrl("/feed.xml")})`,
    `- [Demo QR menu](${absoluteUrl("/m/demo-taverna?table=12")})`,
    "- English UI: append ?lang=en to any marketing URL",
    "",
    "## Επικοινωνία",
    `- Τηλέφωνο: [${SEO_SITE.contactPhone}](tel:${SEO_SITE.contactPhoneTel})`,
    `- Email: [${SEO_SITE.contactEmail}](mailto:${SEO_SITE.contactEmail})`,
    `- Facebook: ${SEO_SITE.contactFacebook}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
