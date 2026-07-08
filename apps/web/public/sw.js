// menuos-sw-v5

function resolveNotificationTarget(rawUrl) {
  try {
    const absolute = new URL(rawUrl || "/", self.location.origin);
    return {
      href: absolute.href,
      path: `${absolute.pathname}${absolute.search}${absolute.hash}`,
      origin: absolute.origin,
    };
  } catch {
    return {
      href: `${self.location.origin}/`,
      path: "/",
      origin: self.location.origin,
    };
  }
}

async function openNotificationTarget(rawUrl) {
  const target = resolveNotificationTarget(rawUrl);
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  const sameOrigin = clients.filter((client) => {
    try {
      return new URL(client.url).origin === target.origin;
    } catch {
      return false;
    }
  });

  for (const client of sameOrigin) {
    if (client.url === target.href && "focus" in client) {
      return client.focus();
    }
  }

  const waiterClients = sameOrigin.filter((client) => {
    try {
      return isWaiterPanelPath(new URL(client.url).pathname);
    } catch {
      return false;
    }
  });

  for (const client of waiterClients) {
    if (!("navigate" in client)) continue;
    try {
      const opened = await client.navigate(target.href);
      if (opened && "focus" in opened) return opened.focus();
      if ("focus" in client) return client.focus();
    } catch {
      /* try next client */
    }
  }

  for (const client of sameOrigin) {
    if (!("navigate" in client)) continue;
    try {
      const opened = await client.navigate(target.href);
      if (opened && "focus" in opened) return opened.focus();
      if ("focus" in client) return client.focus();
    } catch {
      /* try openWindow */
    }
  }

  if (!self.clients.openWindow) return undefined;

  const opened = await self.clients.openWindow(target.path);
  if (opened) return opened;

  return self.clients.openWindow(target.href);
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

async function isWaiterPanelVisible() {
  const waiterClients = await findWaiterClients();
  return waiterClients.some((client) => client.visibilityState === "visible");
}

function playBeepInSw() {
  try {
    const AudioCtx = self.AudioContext || self.webkitAudioContext;
    if (!AudioCtx) return Promise.resolve();
    const ctx = new AudioCtx();
    const run = () => {
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.14;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(880, ctx.currentTime, 0.12);
      playTone(988, ctx.currentTime + 0.18, 0.18);
      return new Promise((resolve) => {
        self.setTimeout(() => {
          void ctx.close().catch(() => undefined);
          resolve();
        }, 450);
      });
    };
    if (ctx.state === "suspended") {
      return ctx.resume().then(run).catch(() => undefined);
    }
    return run();
  } catch {
    return Promise.resolve();
  }
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

async function handlePassAlert(data) {
  const tag = typeof data.tag === "string" ? data.tag : "";
  if (!tag.startsWith("pass-")) return;

  const waiterVisible = await isWaiterPanelVisible();
  const waiterClients = await findWaiterClients();

  if (waiterVisible && waiterClients.length > 0) {
    for (const client of waiterClients) {
      client.postMessage({
        type: "MENUOS_PASS_ALERT",
        passId: data.passId,
        zoneId: data.zoneId,
        announcement: data.announcement,
        voiceEnabled: Boolean(data.voiceEnabled),
      });
    }
    return;
  }

  await playBeepInSw();
  if (data.voiceEnabled && data.announcement) {
    await playAnnouncementInSw(data.announcement);
  }
}

self.addEventListener("push", (event) => {
  let data = { title: "MenuOS", body: "", url: "/" };
  try {
    data = { ...data, ...event.data?.json() };
  } catch {
    /* ignore malformed payload */
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon",
        badge: "/icon",
        tag: data.tag ?? "menuos-waiter",
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        renotify: true,
        silent: false,
        data: { url: data.url },
      }),
      handlePassAlert(data),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url ?? "/";
  event.waitUntil(openNotificationTarget(rawUrl));
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
