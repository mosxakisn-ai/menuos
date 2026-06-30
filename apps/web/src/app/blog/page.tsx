import Link from "next/link";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SEO_BLOG_INDEX } from "@/content/seo-blog";
import { getSeoBlogPostsSortedResolved } from "@/lib/seo-blog";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildWebPageSchema } from "@/lib/seo-structured-data";

export const metadata = buildPageMetadata({
  title: SEO_BLOG_INDEX.title,
  description: SEO_BLOG_INDEX.description,
  path: SEO_BLOG_INDEX.path,
  keywords: ["QR menu blog", "ψηφιακό menu οδηγός", "MenuOS blog"],
});

export default async function BlogIndexPage() {
  const posts = await getSeoBlogPostsSortedResolved();
  const breadcrumbs = [
    { name: "Αρχική", path: "/" },
    { name: SEO_BLOG_INDEX.breadcrumbLabel, path: SEO_BLOG_INDEX.path },
  ];

  return (
    <MarketingLayout>
      <JsonLdScript
        data={[
          buildBreadcrumbSchema(breadcrumbs),
          buildWebPageSchema({
            name: SEO_BLOG_INDEX.title,
            path: SEO_BLOG_INDEX.path,
            description: SEO_BLOG_INDEX.description,
          }),
        ]}
      />
      <MarketingPageHero
        title="Blog"
        subtitle="Οδηγοί και tips για QR menu, ψηφιακό κατάλογο και εξυπηρέτηση πελατών."
        badge="MenuOS"
      />
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
                  {post.publishedAt} · {post.readingMinutes} λεπτά
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </MarketingLayout>
  );
}
