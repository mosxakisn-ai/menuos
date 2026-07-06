"use client";

const SESSION_KEY = "menuos_visitor_sid";
const HEARTBEAT_MS = 45_000;

export type VisitorIntentSurface = "marketing" | "register" | "checkout";
export type VisitorIntentStep =
  | "browse"
  | "pricing"
  | "register_start"
  | "register_otp"
  | "checkout_opened"
  | "pay_clicked"
  | "stripe_redirect"
  | "payment_success"
  | "payment_failed"
  | "stripe_init_failed"
  | "heartbeat"
  | "session_end";

type IntentCtx = {
  surface: VisitorIntentSurface;
  step: VisitorIntentStep;
  path: string;
  planId?: string;
  visitorLabel?: string;
};

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatCtx: IntentCtx | null = null;
let unloadHooksRegistered = false;

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `mo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readPersist(key: string) {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePersist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return;
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getVisitorSessionId() {
  if (typeof window === "undefined") return "";
  let sid = readPersist(SESSION_KEY);
  if (!sid) {
    sid = randomId();
    writePersist(SESSION_KEY, sid);
  }
  return sid;
}

function postPayload(payload: Record<string, unknown>, keepalive = false) {
  const url = "/api/visitor-intent";
  const body = JSON.stringify(payload);
  try {
    if (keepalive && typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      } catch {
        navigator.sendBeacon(url, body);
      }
      return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function reportVisitorIntent(opts: {
  surface: VisitorIntentSurface;
  step: VisitorIntentStep;
  path?: string;
  planId?: string;
  visitorLabel?: string;
}) {
  if (typeof window === "undefined") return;
  const sid = getVisitorSessionId();
  postPayload({
    sid,
    surface: opts.surface,
    step: opts.step,
    path: opts.path ?? window.location.pathname,
    planId: opts.planId,
    visitorLabel: opts.visitorLabel,
    referrer: document.referrer || undefined,
    source: "web",
  });
}

function emitSessionEnd() {
  if (!heartbeatCtx) return;
  postPayload(
    {
      sid: getVisitorSessionId(),
      surface: heartbeatCtx.surface,
      step: "session_end",
      path: heartbeatCtx.path,
      source: "web",
    },
    true,
  );
}

function registerUnloadHooks() {
  if (unloadHooksRegistered || typeof window === "undefined") return;
  unloadHooksRegistered = true;
  const onLeave = () => {
    emitSessionEnd();
    stopVisitorIntentHeartbeat();
  };
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("beforeunload", onLeave);
}

export function startVisitorIntentHeartbeat(ctx: IntentCtx) {
  if (typeof window === "undefined") return;
  heartbeatCtx = { ...ctx };
  registerUnloadHooks();

  const tick = () => {
    if (document.visibilityState !== "visible" || !heartbeatCtx) return;
    reportVisitorIntent({
      surface: heartbeatCtx.surface,
      step: "heartbeat",
      path: heartbeatCtx.path,
      planId: heartbeatCtx.planId,
      visitorLabel: heartbeatCtx.visitorLabel,
    });
  };

  reportVisitorIntent({
    surface: ctx.surface,
    step: ctx.step,
    path: ctx.path,
    planId: ctx.planId,
    visitorLabel: ctx.visitorLabel,
  });

  if (heartbeatTimer) {
    tick();
    return;
  }
  tick();
  heartbeatTimer = setInterval(tick, HEARTBEAT_MS);
}

export function stopVisitorIntentHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  heartbeatCtx = null;
}

const EXCLUDED_PREFIXES = [
  "/supervisor",
  "/m/",
  "/s/",
  "/kds",
  "/bds",
  "/cold",
  "/dessert",
  "/api/",
  "/login",
];

export function resolveVisitorIntentFromPath(pathname: string): IntentCtx | null {
  if (pathname.startsWith("/dashboard/billing")) {
    return { surface: "checkout", step: "checkout_opened", path: pathname };
  }
  if (pathname.startsWith("/register")) {
    return { surface: "register", step: "register_start", path: pathname };
  }
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (pathname.startsWith("/dashboard")) return null;
  if (pathname === "/pricing") {
    return { surface: "marketing", step: "pricing", path: pathname };
  }
  return { surface: "marketing", step: "browse", path: pathname };
}
