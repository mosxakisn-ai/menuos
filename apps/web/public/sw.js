// menuos-sw-v14
function resolveNotificationTarget(rawUrl) {
  try {
    const absolute = new URL(rawUrl || "/", self.location.origin);
    const pathname = absolute.pathname;
    const slugMatch = pathname.match(/^\/s\/([^/]+)/);
    return {
      href: absolute.href,
      path: `${pathname}${absolute.search}${absolute.hash}`,
      origin: absolute.origin,
      waiterSlug: slugMatch ? decodeURIComponent(slugMatch[1]) : null,
    };
  } catch {
    return {
      href: `${self.location.origin}/`,
      path: "/",
      origin: self.location.origin,
      waiterSlug: null,
    };
  }
}

function clientMatchesTarget(clientUrl, target) {
  try {
    const client = new URL(clientUrl);
    if (client.origin !== target.origin) return false;
    if (client.href === target.href) return true;
    if (target.waiterSlug) {
      const clientSlugMatch = client.pathname.match(/^\/s\/([^/]+)/);
      const clientSlug = clientSlugMatch ? decodeURIComponent(clientSlugMatch[1]) : null;
      if (clientSlug && clientSlug === target.waiterSlug) return true;
    }
    return client.pathname === new URL(target.href).pathname;
  } catch {
    return false;
  }
}

async function openNotificationTarget(rawUrl) {
  const target = resolveNotificationTarget(rawUrl);
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of clients) {
    if (clientMatchesTarget(client.url, target) && "focus" in client) {
      return client.focus();
    }
  }

  const waiterClients = clients.filter((client) => {
    try {
      return isWaiterPanelPath(new URL(client.url).pathname);
    } catch {
      return false;
    }
  });

  for (const client of waiterClients) {
    if (clientMatchesTarget(client.url, target) && "focus" in client) {
      return client.focus();
    }
    if ("navigate" in client) {
      try {
        const opened = await client.navigate(target.href);
        if (opened && "focus" in opened) return opened.focus();
      } catch {
        /* try next */
      }
    }
  }

  for (const client of clients) {
    try {
      if (new URL(client.url).origin !== target.origin) continue;
      if ("navigate" in client) {
        try {
          const opened = await client.navigate(target.href);
          if (opened && "focus" in opened) return opened.focus();
        } catch {
          /* try openWindow */
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!self.clients.openWindow) return undefined;

  let opened = await self.clients.openWindow(target.href);
  if (opened) return opened;

  opened = await self.clients.openWindow(target.path);
  return opened;
}

function isWaiterPanelPath(pathname) {
  return pathname.startsWith("/s/") || pathname.startsWith("/dashboard/waiter");
}

async function findWaiterClients() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  return clients.filter((client) => {
    try {
      return isWaiterPanelPath(new URL(client.url).pathname);
    } catch {
      return false;
    }
  });
}

function isVisibleWaiterClient(client) {
  return client.visibilityState === "visible";
}

async function playBufferInSw(arrayBuffer) {
  const AudioCtx = self.AudioContext || self.webkitAudioContext;
  if (!AudioCtx) return false;
  try {
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") await ctx.resume();
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    await new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        void ctx.close().catch(() => undefined);
        resolve();
      };
      source.start(0);
    });
    return true;
  } catch {
    return false;
  }
}

const PASS_BEEP_TONES = [
  { freq: 880, startMs: 0, durationMs: 140, gain: 0.42 },
  { freq: 1100, startMs: 180, durationMs: 140, gain: 0.45 },
  { freq: 1320, startMs: 360, durationMs: 160, gain: 0.48 },
];

const GUEST_BEEP_TONES = [
  { freq: 660, startMs: 0, durationMs: 150, gain: 0.4 },
  { freq: 880, startMs: 220, durationMs: 180, gain: 0.42 },
];

function playBeepWebAudio(kind) {
  const tones = kind === "pass" ? PASS_BEEP_TONES : GUEST_BEEP_TONES;
  try {
    const AudioCtx = self.AudioContext || self.webkitAudioContext;
    if (!AudioCtx) return Promise.resolve(false);
    const ctx = new AudioCtx();
    const run = () => {
      if (ctx.state === "suspended") return false;
      const base = ctx.currentTime;
      for (const tone of tones) {
        const start = base + tone.startMs / 1000;
        const duration = tone.durationMs / 1000;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = tone.freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(tone.gain, start + 0.01);
        gain.gain.setValueAtTime(tone.gain, start + duration - 0.02);
        gain.gain.linearRampToValueAtTime(0, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.01);
      }
      return true;
    };
    const closeLater = () => {
      self.setTimeout(() => {
        void ctx.close().catch(() => undefined);
      }, 900);
    };
    if (ctx.state === "suspended") {
      return ctx
        .resume()
        .then(() => run())
        .catch(() => false)
        .finally(closeLater);
    }
    const started = run();
    closeLater();
    return Promise.resolve(started);
  } catch {
    return Promise.resolve(false);
  }
}

async function playBeepWavFallback(kind) {
  try {
    const apiRes = await fetch(`/api/waiter-beep?kind=${kind}`, {
      credentials: "same-origin",
      cache: "force-cache",
    });
    if (!apiRes.ok) return false;
    return playBufferInSw(await apiRes.arrayBuffer());
  } catch {
    return false;
  }
}

async function playBeepInSw(kind) {
  if (await playBeepWavFallback(kind)) return true;
  return playBeepWebAudio(kind);
}

async function playAnnouncementInSw(announcement) {
  const text = typeof announcement === "string" ? announcement.trim() : "";
  if (!text) return;
  try {
    const res = await fetch(
      `/api/pass-announcement-audio?text=${encodeURIComponent(text)}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return;
    const arrayBuffer = await res.arrayBuffer();
    const AudioCtx = self.AudioContext || self.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") await ctx.resume();
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    await new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        void ctx.close().catch(() => undefined);
        resolve();
      };
      source.start(0);
    });
  } catch {
    /* background audio may be blocked on some OEM skins */
  }
}

function pushTagKind(tag) {
  if (typeof tag !== "string") return "other";
  if (tag.startsWith("pass-")) return "pass";
  if (tag.startsWith("waiter-")) return "waiter";
  return "other";
}

function postStaffAlertToClient(client, kind, data) {
  if (kind === "pass") {
    client.postMessage({
      type: "MENUOS_PASS_ALERT",
      passId: data.passId,
      zoneId: data.zoneId,
      announcement: data.announcement,
      voiceEnabled: Boolean(data.voiceEnabled),
    });
    return;
  }
  client.postMessage({
    type: "MENUOS_WAITER_CALL_ALERT",
    callId: data.callId,
  });
}

/** @returns {{ source: "panel"|"sw"|"none", swBeepPlayed: boolean }} */
async function handleStaffPushAlert(data) {
  const kind = pushTagKind(data.tag);
  if (kind === "other") return { source: "none", swBeepPlayed: false };

  const waiterClients = await findWaiterClients();
  const visibleWaiterClients = waiterClients.filter(isVisibleWaiterClient);

  for (const client of visibleWaiterClients) {
    postStaffAlertToClient(client, kind, data);
  }

  if (visibleWaiterClients.length > 0) {
    return { source: "panel", swBeepPlayed: false };
  }

  const beepPlayed = await playBeepInSw(kind === "pass" ? "pass" : "guest");
  if (kind === "pass" && data.voiceEnabled && data.announcement) {
    await playAnnouncementInSw(data.announcement);
  }
  return { source: "sw", swBeepPlayed: beepPlayed };
}

function staffPushNotificationSilent(staffPush, audioSource, swBeepPlayed) {
  if (!staffPush) return false;
  if (audioSource === "panel") return true;
  if (audioSource === "sw") return swBeepPlayed;
  return false;
}

self.addEventListener("push", (event) => {
  let data = { title: "MenuOS", body: "", url: "/" };
  try {
    data = { ...data, ...event.data?.json() };
  } catch {
    /* ignore malformed payload */
  }

  const openTarget = resolveNotificationTarget(data.url);
  const pushKind = pushTagKind(data.tag);
  const staffPush = pushKind === "pass" || pushKind === "waiter";

  event.waitUntil(
    (async () => {
      const audio = await handleStaffPushAlert(data);
      const notificationSilent = staffPushNotificationSilent(
        staffPush,
        audio.source,
        audio.swBeepPlayed,
      );
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon",
        badge: "/icon",
        tag: data.tag ?? "menuos-waiter",
        vibrate: [400, 120, 400, 120, 400, 120, 400],
        requireInteraction: true,
        renotify: true,
        silent: notificationSilent,
        data: {
          url: data.url || openTarget.href,
          path: openTarget.path,
        },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url ?? event.notification.data?.path ?? "/";
  event.waitUntil(openNotificationTarget(rawUrl));
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
