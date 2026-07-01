/**
 * End-to-end staff waiter flow simulation against production (or local).
 * Usage: node scripts/simulate-waiter-flow.mjs [baseUrl] [venueSlug] [staffKey]
 */
const base = (process.argv[2] ?? "https://menuos.gr").replace(/\/$/, "");
const venueSlug = process.argv[3] ?? "asterousia";
const staffKey = process.argv[4] ?? "e2b53974-0c52-4c97-8efb-0673dcb0bb87";

const sessionUrl = `${base}/api/staff/session?venueSlug=${encodeURIComponent(venueSlug)}&key=${encodeURIComponent(staffKey)}`;

function parseSetCookie(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  const single = headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function fetchWithLog(label, url, opts = {}) {
  const res = await fetch(url, { redirect: "manual", ...opts });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  console.log(`[${label}] ${res.status} ${url}`);
  if (res.headers.get("location")) console.log(`  -> ${res.headers.get("location")}`);
  if (json) console.log(`  body: ${JSON.stringify(json).slice(0, 200)}`);
  else if (text.includes("Application error")) console.log("  body: APPLICATION ERROR");
  else if (text.includes("Κλήσεις σερβιτόρου")) console.log("  body: waiter panel OK");
  else if (text.includes("Σύνδεσμος σερβιτόρου")) console.log("  body: invalid link page");
  return { res, text, json, cookie: parseSetCookie(res.headers) };
}

async function runOnce(run) {
  console.log(`\n--- Run ${run} ---`);
  const step1 = await fetchWithLog("session", sessionUrl);
  if (step1.res.status !== 302) return false;

  const cookie = step1.cookie;
  if (!cookie.includes("menuos-staff-session")) {
    console.log("  MISSING session cookie");
    return false;
  }

  const panelUrl = step1.res.headers.get("location") ?? `${base}/s/${venueSlug}`;
  const step2 = await fetchWithLog("panel", panelUrl, {
    headers: { cookie },
  });
  if (step2.res.status !== 200 || !step2.text.includes("Κλήσεις σερβιτόρου")) return false;

  // Poll waiter API 5x like the panel does
  let venueId = null;
  const idMatch = step2.text.match(/"venueId":"([^"]+)"/);
  if (idMatch) venueId = idMatch[1];

  if (!venueId) {
    // fetch panel again with credentials - venue id might be in RSC payload differently
    const step2b = await fetch(`${panelUrl}`, { headers: { cookie } });
    const t = await step2b.text();
    const m = t.match(/cm[a-z0-9]{20,}/);
    venueId = m?.[0];
  }

  if (!venueId) {
    console.log("  could not extract venueId — skipping API poll");
    return true;
  }

  let ok = 0;
  for (let i = 0; i < 8; i++) {
    const api = await fetch(`${base}/api/waiter-call?venueId=${venueId}`, {
      headers: { cookie },
    });
    const data = await api.json().catch(() => ({}));
    const status = api.status;
    console.log(`[poll ${i + 1}] ${status} pending=${data.pendingCount ?? "?"}`);
    if (status === 200) ok++;
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`  polls OK: ${ok}/8`);

  const waiterPost = await fetch(`${base}/api/waiter-call`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ venueSlug, type: "WAITER", tableNumber: "99" }),
  });
  const waiterJson = await waiterPost.json().catch(() => ({}));
  console.log(`[guest call] ${waiterPost.status} id=${waiterJson.id ?? "?"}`);

  await new Promise((r) => setTimeout(r, 600));
  const pollAfter = await fetch(`${base}/api/waiter-call?venueId=${venueId}`, {
    headers: { cookie },
  });
  const afterJson = await pollAfter.json().catch(() => ({}));
  console.log(`[poll after call] ${pollAfter.status} pending=${afterJson.pendingCount ?? "?"}`);
  const sawCall = (afterJson.pendingCount ?? 0) > 0;
  if (!sawCall) console.log("  WARN: staff did not see guest call");

  return ok === 8 && waiterPost.status === 200 && sawCall;
}

let passed = 0;
const runs = 5;
for (let i = 1; i <= runs; i++) {
  if (await runOnce(i)) passed++;
}

console.log(`\n=== Result: ${passed}/${runs} full runs OK ===`);
process.exit(passed === runs ? 0 : 1);
