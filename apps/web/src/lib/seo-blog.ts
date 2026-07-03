import { SEO_BLOG_POSTS, type SeoBlogPost } from "@/content/seo-blog";
import { applyCatalogMarketingPlaceholdersDeep } from "@/lib/plan-pricing-marketing";

export function getAllSeoBlogSlugs(): string[] {
  return SEO_BLOG_POSTS.map((post) => post.slug);
}

export function getSeoBlogPost(slug: string): SeoBlogPost | null {
  return SEO_BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export async function getSeoBlogPostResolved(slug: string): Promise<SeoBlogPost | null> {
  const post = getSeoBlogPost(slug);
  if (!post) return null;
  return applyCatalogMarketingPlaceholdersDeep(post, "el");
}

export function getSeoBlogPostsSorted(): SeoBlogPost[] {
  return [...SEO_BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getSeoBlogPostsSortedResolved(): Promise<SeoBlogPost[]> {
  return applyCatalogMarketingPlaceholdersDeep(getSeoBlogPostsSorted(), "el");
}
