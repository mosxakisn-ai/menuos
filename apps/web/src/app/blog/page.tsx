import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SEO_SITE_EN } from "@/content/seo-en";
import { getServerLocale } from "@/i18n/server";
import { getSeoBlogIndexMeta, getSeoBlogPostsSortedResolved } from "@/lib/seo-blog";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildWebPageSchema } from "@/lib/seo-structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const meta = getSeoBlogIndexMeta(locale);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: meta.path,
    keywords: ["QR menu blog", "ψηφιακό menu οδηγός", "MenuOS blog"],
    locale,
  });
}

export default async function BlogIndexPage() {
  const locale = await getServerLocale();
  const meta = getSeoBlogIndexMeta(locale);
  const posts = await getSeoBlogPostsSortedResolved(locale);
  const homeLabel = locale === "en" ? SEO_SITE_EN.breadcrumbHome : "Αρχική";
  const breadcrumbs = [
    { name: homeLabel, path: "/" },
    { name: meta.breadcrumbLabel, path: meta.path },
  ];
  const heroSubtitle =
    locale === "en"
      ? "Guides and tips for QR menus, digital catalogs and guest service."
      : "Οδηγοί και tips για QR menu, ψηφιακό κατάλογο και εξυπηρέτηση πελατών.";
  const readingLabel = locale === "en" ? "min read" : "λεπτά";

  return (
    <MarketingLayout>
      <JsonLdScript
        data={[
          buildBreadcrumbSchema(breadcrumbs),
          buildWebPageSchema({
            name: meta.title,
            path: meta.path,
            description: meta.description,
            locale,
          }),
        ]}
      />
      <MarketingPageHero title="Blog" subtitle={heroSubtitle} badge="MenuOS" />
      <MarketingSection>
        <ul className="mx-auto max-w-3xl space-y-8">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-slate-200/80 pb-8 last:border-0">
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="text-xl font-bold text-brand-navy group-hover:text-brand-blue">
                  {post.title}
                </h2>
                <p className="mt-2 text-slate-600">{post.description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {post.publishedAt} · {post.readingMinutes} {readingLabel}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </MarketingLayout>
  );
}
