import { SEO_BLOG_INDEX, SEO_BLOG_POSTS, type SeoBlogPost } from "@/content/seo-blog";
import { SEO_PAGES_EN } from "@/content/seo-en";
import type { Locale } from "@/i18n/types";
import { applyCatalogMarketingPlaceholdersDeep } from "@/lib/plan-pricing-marketing";

export function getSeoBlogIndexMeta(locale: Locale) {
  if (locale === "en") {
    return SEO_PAGES_EN.blog;
  }
  return SEO_BLOG_INDEX;
}

export function getAllSeoBlogSlugs(): string[] {
  return SEO_BLOG_POSTS.map((post) => post.slug);
}

export function getSeoBlogPost(slug: string): SeoBlogPost | null {
  return SEO_BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export async function getSeoBlogPostResolved(
  slug: string,
  locale: Locale = "el",
): Promise<SeoBlogPost | null> {
  const post = getSeoBlogPost(slug);
  if (!post) return null;
  return applyCatalogMarketingPlaceholdersDeep(post, locale);
}

export function getSeoBlogPostsSorted(): SeoBlogPost[] {
  return [...SEO_BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getSeoBlogPostsSortedResolved(locale: Locale = "el"): Promise<SeoBlogPost[]> {
  return applyCatalogMarketingPlaceholdersDeep(getSeoBlogPostsSorted(), locale);
}
