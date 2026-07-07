/** User-Agents που δεν μετράνε ως πραγματικοί επισκέπτες. */
const AUTOMATED_UA_PATTERNS = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /wget/i,
  /\bcurl\//i,
  /python-requests/i,
  /scrapy/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /lighthouse/i,
  /pagespeed/i,
  /gtmetrix/i,
  /pingdom/i,
  /uptimerobot/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /archive\.org/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /googlebot/i,
  /google-inspectiontool/i,
  /googleother/i,
  /storebot-google/i,
  /bingbot/i,
  /yandex/i,
  /baiduspider/i,
  /applebot/i,
  /duckduckbot/i,
] as const;

/** Γνωστά IP ranges crawlers (Google, Bing, …). */
const CRAWLER_IP_PREFIXES = [
  "66.249.",
  "64.233.",
  "72.14.",
  "209.85.",
  "216.239.",
  "74.125.",
  "173.194.",
  "157.55.",
  "207.46.",
  "40.77.",
  "13.66.",
  "199.30.",
  "17.58.", // Applebot range (partial)
] as const;

const FUNNEL_STEPS = new Set([
  "pricing",
  "register_start",
  "register_otp",
  "checkout_opened",
  "pay_clicked",
  "stripe_redirect",
  "payment_success",
  "payment_cancelled",
  "payment_failed",
  "stripe_init_failed",
]);

/** Default owner/dev account — δεν εμφανίζεται στα analytics επισκεπτών. */
const DEFAULT_EXCLUDED_VISITOR_LABELS = ["mosxakisn@gmail.com"] as const;

let excludedVisitorLabelsCache: Set<string> | null = null;

function buildExcludedVisitorLabels(): Set<string> {
  const labels = new Set<string>(DEFAULT_EXCLUDED_VISITOR_LABELS);
  for (const raw of [process.env.VISITOR_INTENT_EXCLUDE_LABELS, process.env.SEED_MASTER_EMAIL]) {
    if (!raw?.trim()) continue;
    for (const part of raw.split(",")) {
      const email = part.trim().toLowerCase();
      if (email) labels.add(email);
    }
  }
  return labels;
}

/** Εσωτερικός λογαριασμός (dev/owner) — κρύβεται από supervisor analytics. */
export function isExcludedInternalVisitorLabel(label: string | null | undefined): boolean {
  const norm = label?.trim().toLowerCase();
  if (!norm) return false;
  excludedVisitorLabelsCache ??= buildExcludedVisitorLabels();
  return excludedVisitorLabelsCache.has(norm);
}

export type VisitorIntentLike = {
  sessionId: string;
  surface: string;
  step: string;
  path: string | null;
  visitorLabel: string | null;
  clientIp: string | null;
  stepTrail: { step: string; at: number }[];
};

export function isAutomatedUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent?.trim()) return false;
  return AUTOMATED_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function isKnownCrawlerIp(ip: string | null | undefined): boolean {
  const norm = ip?.trim();
  if (!norm) return false;
  return CRAWLER_IP_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

function sessionReachedFunnel(row: VisitorIntentLike): boolean {
  if (FUNNEL_STEPS.has(row.step)) return true;
  return row.stepTrail.some((t) => FUNNEL_STEPS.has(t.step));
}

function isBlogOnlySession(row: VisitorIntentLike): boolean {
  const path = (row.path ?? "").split("?")[0];
  if (!path.startsWith("/blog")) return false;
  return !sessionReachedFunnel(row);
}

/** Πραγματικός ενδιαφερόμενος πελάτης — όχι bot/crawler/blog-only scrape/εσωτερικός λογαριασμός. */
export function isRealCustomerVisitor(row: VisitorIntentLike): boolean {
  if (row.sessionId.startsWith("test-")) return false;
  if (isKnownCrawlerIp(row.clientIp)) return false;
  if (isExcludedInternalVisitorLabel(row.visitorLabel)) return false;

  if (row.surface === "register" || row.surface === "checkout") return true;
  if (row.visitorLabel?.trim()) return true;
  if (sessionReachedFunnel(row)) return true;

  if (isBlogOnlySession(row)) return false;

  return true;
}
