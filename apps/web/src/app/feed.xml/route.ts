import { SEO_BLOG_INDEX } from "@/content/seo-blog";
import { APP_NAME } from "@/lib/config";
import { getSeoBlogPostsSortedResolved } from "@/lib/seo-blog";
import { absoluteUrl } from "@/lib/seo";

export async function GET() {
  const posts = await getSeoBlogPostsSortedResolved();
  const feedUrl = absoluteUrl("/feed.xml");
  const blogUrl = absoluteUrl(SEO_BLOG_INDEX.path);

  const items = posts
    .map((post) => {
      const link = absoluteUrl(`/blog/${post.slug}`);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${APP_NAME} Blog`)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(SEO_BLOG_INDEX.description)}</description>
    <language>el-GR</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
