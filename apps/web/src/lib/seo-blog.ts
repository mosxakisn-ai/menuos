import { SEO_BLOG_POSTS, type SeoBlogPost } from "@/content/seo-blog";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { applyTrialDayPlaceholdersDeep } from "@/lib/trial-marketing";

export function getAllSeoBlogSlugs(): string[] {
  return SEO_BLOG_POSTS.map((post) => post.slug);
}

export function getSeoBlogPost(slug: string): SeoBlogPost | null {
  return SEO_BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export async function getSeoBlogPostResolved(slug: string): Promise<SeoBlogPost | null> {
  const post = getSeoBlogPost(slug);
  if (!post) return null;
  const trialDays = await getTrialDaysFromCatalog();
  return applyTrialDayPlaceholdersDeep(post, trialDays);
}

export function getSeoBlogPostsSorted(): SeoBlogPost[] {
  return [...SEO_BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getSeoBlogPostsSortedResolved(): Promise<SeoBlogPost[]> {
  const trialDays = await getTrialDaysFromCatalog();
  return applyTrialDayPlaceholdersDeep(getSeoBlogPostsSorted(), trialDays);
}
