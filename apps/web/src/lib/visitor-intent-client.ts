"use client";

const SESSION_KEY = "menuos_visitor_sid";
const PEAK_STEP_KEY = "menuos_visitor_peak_step";
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

const STEP_RANK: Partial<Record<VisitorIntentStep, number>> = {
  browse: 1,
  pricing: 2,
  register_start: 3,
  register_otp: 4,
  checkout_opened: 5,
  pay_clicked: 6,
  stripe_redirect: 7,
  payment_failed: 7,
  stripe_init_failed: 7,
  payment_success: 10,
};

function rank(step: VisitorIntentStep | undefined): number {
  if (!step || step === "heartbeat" || step === "session_end") return 0;
  return STEP_RANK[step] ?? 0;
}

function readPeakStep(): VisitorIntentStep | null {
  const raw = readPersist(PEAK_STEP_KEY);
  if (!raw) return null;
  return raw as VisitorIntentStep;
}

function writePeakStep(step: VisitorIntentStep) {
  if (rank(step) <= 0) return;
  writePersist(PEAK_STEP_KEY, step);
}

function clearPeakStep() {
  try {
    localStorage.removeItem(PEAK_STEP_KEY);
    sessionStorage.removeItem(PEAK_STEP_KEY);
  } catch {
    /* ignore */
  }
}

function mergeFunnelStep(prev: VisitorIntentStep | undefined, next: VisitorIntentStep): VisitorIntentStep {
  if (next === "heartbeat" || next === "session_end") return prev ?? next;
  const stored = readPeakStep();
  const best = [prev, stored, next].reduce<VisitorIntentStep | undefined>((acc, s) => {
    if (!s || s === "heartbeat" || s === "session_end") return acc;
    if (!acc || rank(s) >= rank(acc)) return s;
    return acc;
  }, undefined);
  return best ?? next;
}

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

function funnelStepInProgress(): boolean {
  const step = heartbeatCtx?.step ?? readPeakStep();
  return step === "pay_clicked" || step === "stripe_redirect";
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
    if (!funnelStepInProgress()) {
      emitSessionEnd();
      clearPeakStep();
    }
    stopVisitorIntentHeartbeat();
  };
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("beforeunload", onLeave);
}

export function startVisitorIntentHeartbeat(ctx: IntentCtx) {
  if (typeof window === "undefined") return;
  const prevCtx = heartbeatCtx;
  if (ctx.surface === "marketing") {
    clearPeakStep();
  }
  const mergedStep =
    ctx.surface === "marketing" ? ctx.step : mergeFunnelStep(prevCtx?.step, ctx.step);
  const mergedCtx: IntentCtx = {
    ...ctx,
    step: mergedStep,
    visitorLabel: ctx.visitorLabel ?? heartbeatCtx?.visitorLabel,
    planId: ctx.planId ?? heartbeatCtx?.planId,
  };
  writePeakStep(mergedStep);
  heartbeatCtx = { ...mergedCtx };
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
    surface: mergedCtx.surface,
    step: mergedCtx.step,
    path: mergedCtx.path,
    planId: mergedCtx.planId,
    visitorLabel: mergedCtx.visitorLabel,
  });

  if (heartbeatTimer) {
    tick();
    return;
  }
  tick();
  heartbeatTimer = setInterval(tick, HEARTBEAT_MS);
}

export function stopVisitorIntentHeartbeat(opts?: { endSession?: boolean }) {
  if (opts?.endSession && heartbeatCtx) {
    emitSessionEnd();
    clearPeakStep();
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  heartbeatCtx = null;
}

/** Push a funnel step immediately (e.g. OTP sent, pay clicked). */
export function bumpVisitorIntentStep(opts: {
  surface: VisitorIntentSurface;
  step: VisitorIntentStep;
  path?: string;
  planId?: string;
  visitorLabel?: string;
}) {
  if (heartbeatCtx) {
    heartbeatCtx = {
      ...heartbeatCtx,
      surface: opts.surface,
      step: opts.step,
      path: opts.path ?? heartbeatCtx.path,
      planId: opts.planId ?? heartbeatCtx.planId,
      visitorLabel: opts.visitorLabel ?? heartbeatCtx.visitorLabel,
    };
  }
  writePeakStep(opts.step);
  reportVisitorIntent(opts);
  if (opts.step === "payment_success" || opts.step === "payment_failed" || opts.step === "stripe_init_failed") {
    clearPeakStep();
  }
}

/** Update label/plan on active heartbeat without changing step. */
export function patchVisitorIntentMeta(opts: { visitorLabel?: string; planId?: string }) {
  if (!heartbeatCtx) return;
  heartbeatCtx = {
    ...heartbeatCtx,
    visitorLabel: opts.visitorLabel ?? heartbeatCtx.visitorLabel,
    planId: opts.planId ?? heartbeatCtx.planId,
  };
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

export function resolveVisitorIntentFromPath(
  pathname: string,
  search = "",
): IntentCtx | null {
  const qs = search.startsWith("?") ? search.slice(1) : search;
  const planParam = new URLSearchParams(qs).get("plan")?.trim().toUpperCase();
  const planId = planParam && planParam.length <= 20 ? planParam : undefined;

  if (pathname.startsWith("/dashboard/billing")) {
    return { surface: "checkout", step: "checkout_opened", path: pathname };
  }
  if (pathname.startsWith("/register")) {
    return {
      surface: "register",
      step: "register_start",
      path: pathname,
      planId,
    };
  }
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (pathname.startsWith("/dashboard")) return null;
  if (pathname === "/pricing") {
    return { surface: "marketing", step: "pricing", path: pathname };
  }
  return { surface: "marketing", step: "browse", path: pathname };
}
