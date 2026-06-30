import Link from "next/link";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buttonClass } from "@/components/ui/button";
import type { SeoBlogPost } from "@/content/seo-blog";
import { buildBreadcrumbSchema, buildWebPageSchema } from "@/lib/seo-structured-data";

export function SeoBlogArticlePage({ post }: { post: SeoBlogPost }) {
  const breadcrumbs = [
    { name: "Αρχική", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  const jsonLd = [
    buildBreadcrumbSchema(breadcrumbs),
    buildWebPageSchema({
      name: post.title,
      path: `/blog/${post.slug}`,
      description: post.description,
      locale: "el",
    }),
  ];

  return (
    <MarketingLayout>
      <JsonLdScript data={jsonLd} />
      <MarketingPageHero title={post.title} subtitle={post.description} badge="Blog · MenuOS" />
      <MarketingSection>
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand-blue">
                Αρχική
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/blog" className="hover:text-brand-blue">
                Blog
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-brand-navy">{post.title}</li>
          </ol>
        </nav>
        <p className="text-sm text-slate-500">
          {post.publishedAt} · {post.readingMinutes} λεπτά ανάγνωσης
        </p>
        <article className="prose prose-slate mt-8 max-w-none">
          {post.sections.map((section) => (
            <section key={section.heading ?? section.paragraphs[0]} className="mb-8">
              {section.heading ? (
                <h2 className="text-xl font-bold text-brand-navy">{section.heading}</h2>
              ) : null}
              {section.paragraphs.map((p) => (
                <p key={p} className="mt-3 text-base leading-relaxed text-slate-600">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </article>
        {post.relatedPaths.length > 0 ? (
          <div className="mt-10 rounded-card border border-slate-200/80 bg-surface p-6">
            <p className="text-sm font-semibold text-brand-navy">Σχετικές σελίδες</p>
            <ul className="mt-3 space-y-2 text-sm">
              {post.relatedPaths.map((path) => (
                <li key={path}>
                  <Link href={path} className="text-brand-blue hover:underline">
                    {path}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register" className={buttonClass("primary")}>
            Ξεκίνα δωρεάν δοκιμή
          </Link>
          <Link href="/blog" className={buttonClass("secondary")}>
            ← Όλα τα άρθρα
          </Link>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
