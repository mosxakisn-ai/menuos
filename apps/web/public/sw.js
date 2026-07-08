// menuos-sw-v7
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

function pushTagKind(tag) {
  if (typeof tag !== "string") return "other";
  if (tag.startsWith("pass-")) return "pass";
  if (tag.startsWith("waiter-")) return "waiter";
  return "other";
}

async function handleStaffPushAlert(data) {
  const kind = pushTagKind(data.tag);
  if (kind === "other") return;

  const waiterVisible = await isWaiterPanelVisible();
  const waiterClients = await findWaiterClients();

  if (waiterVisible && waiterClients.length > 0) {
    for (const client of waiterClients) {
      if (kind === "pass") {
        client.postMessage({
          type: "MENUOS_PASS_ALERT",
          passId: data.passId,
          zoneId: data.zoneId,
          announcement: data.announcement,
          voiceEnabled: Boolean(data.voiceEnabled),
        });
      } else {
        client.postMessage({
          type: "MENUOS_WAITER_CALL_ALERT",
          callId: data.callId,
        });
      }
    }
    return;
  }

  await playBeepInSw();
  if (kind === "pass" && data.voiceEnabled && data.announcement) {
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

  const openTarget = resolveNotificationTarget(data.url);

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
        data: {
          url: data.url || openTarget.href,
          path: openTarget.path,
        },
      }),
      handleStaffPushAlert(data),
    ]),
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
