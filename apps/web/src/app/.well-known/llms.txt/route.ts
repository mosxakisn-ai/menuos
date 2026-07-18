import { buildLlmsTxtMarkdown, llmsTxtResponseHeaders } from "@/lib/llms-txt";

/** Same document as /llms.txt — some AI agents look under /.well-known/. */
export async function GET() {
  const body = await buildLlmsTxtMarkdown();
  return new Response(body, { headers: llmsTxtResponseHeaders() });
}
