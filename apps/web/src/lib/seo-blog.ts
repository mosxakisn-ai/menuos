import { SEO_BLOG_POSTS, type SeoBlogPost } from "@/content/seo-blog";

export function getAllSeoBlogSlugs(): string[] {
  return SEO_BLOG_POSTS.map((post) => post.slug);
}

export function getSeoBlogPost(slug: string): SeoBlogPost | null {
  return SEO_BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function getSeoBlogPostsSorted(): SeoBlogPost[] {
  return [...SEO_BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
