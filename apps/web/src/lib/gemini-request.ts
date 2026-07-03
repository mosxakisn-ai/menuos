import { geminiGenerateContent } from "@/lib/gemini-fetch";
import {
  assertGeminiTokenQuota,
  extractGeminiUsage,
  logGeminiUsageEvent,
  type GeminiOperation,
} from "@/lib/gemini-usage-service";

type GeminiJsonResponse = {
  error?: { message?: string };
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

export async function geminiGenerateContentForOrg(
  organizationId: string,
  operation: GeminiOperation,
  model: string,
  apiKey: string,
  body: unknown,
): Promise<{ response: Response; data: GeminiJsonResponse }> {
  await assertGeminiTokenQuota(organizationId);

  const response = await geminiGenerateContent(model, apiKey, body);
  const data = (await response.json()) as GeminiJsonResponse;
  const usage = extractGeminiUsage(data);

  await logGeminiUsageEvent({
    organizationId,
    operation,
    model,
    ...usage,
    success: response.ok,
    httpStatus: response.status,
  });

  return { response, data };
}
