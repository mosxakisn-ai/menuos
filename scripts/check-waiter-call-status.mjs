/**
 * Check guest waiter-call status (cross-platform; no curl/PowerShell quirks).
 * Usage: node scripts/check-waiter-call-status.mjs [baseUrl] [venueSlug] [tableNumber]
 */
const base = (process.argv[2] ?? "https://menuos.gr").replace(/\/$/, "");
const venueSlug = process.argv[3] ?? "demo-taverna";
const tableNumber = process.argv[4] ?? "12";
const timeoutMs = Number(process.env.TIMEOUT_MS ?? 15_000);

const url = `${base}/api/waiter-call/status?venueSlug=${encodeURIComponent(venueSlug)}&tableNumber=${encodeURIComponent(tableNumber)}`;

async function main() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }

    console.log(`${res.status} ${url}`);
    console.log(JSON.stringify(body, null, 2));
    process.exit(res.ok ? 0 : 1);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`FAILED (${timeoutMs}ms timeout): ${msg}`);
    console.error(url);
    process.exit(1);
  } finally {
    clearTimeout(timer);
  }
}

main();
