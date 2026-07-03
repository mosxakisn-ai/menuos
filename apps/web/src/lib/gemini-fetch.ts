const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

const RETRYABLE_STATUS = new Set([429, 503, 502, 504]);
const DEFAULT_MAX_RETRIES = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** POST to Gemini generateContent with retry on rate-limit / transient errors. */
export async function geminiGenerateContent(
  model: string,
  apiKey: string,
  body: unknown,
  options?: { maxRetries?: number },
): Promise<Response> {
  const url = `${GEMINI_API}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (RETRYABLE_STATUS.has(res.status) && attempt < maxRetries) {
      const delayMs = Math.min(1000 * 2 ** attempt, 15000);
      await sleep(delayMs);
      continue;
    }

    return res;
  }

  throw new Error("Gemini request failed after retries.");
}
