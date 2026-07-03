import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoBlogArticlePage } from "@/components/seo/seo-blog-page";
import { getServerLocale } from "@/i18n/server";
import { getAllSeoBlogSlugs, getSeoBlogPostResolved } from "@/lib/seo-blog";
import { buildPageMetadata } from "@/lib/seo";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSeoBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getServerLocale();
  const { slug } = await params;
  const post = await getSeoBlogPostResolved(slug, locale);
  if (!post) notFound();

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: ["QR menu", "ψηφιακό menu", post.slug],
    locale,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const locale = await getServerLocale();
  const { slug } = await params;
  const post = await getSeoBlogPostResolved(slug, locale);
  if (!post) notFound();

  return <SeoBlogArticlePage post={post} locale={locale} />;
}
