import { SEO_LLMS } from "@/content/seo-el";

export function GET() {
  return new Response(SEO_LLMS, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
