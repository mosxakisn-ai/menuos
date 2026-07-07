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

async function hasVisibleClient() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  return clients.some((client) => client.visibilityState === "visible");
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
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.volume = 1;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(audio.error);
      };
      const played = audio.play();
      if (played && typeof played.then === "function") {
        played.catch(reject);
      }
    });
  } catch {
    /* background audio may be blocked on some OEM skins */
  }
}

async function handlePassVoice(data) {
  if (!data.voiceEnabled || !data.announcement) return;
  const visible = await hasVisibleClient();
  if (visible) {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({
        type: "MENUOS_PASS_VOICE",
        announcement: data.announcement,
      });
    }
    return;
  }
  await playBeepInSw();
  await playAnnouncementInSw(data.announcement);
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
      handlePassVoice(data),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  const targetOrigin = (() => {
    try {
      return new URL(url, self.location.origin).origin;
    } catch {
      return self.location.origin;
    }
  })();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          try {
            if (new URL(client.url).origin === targetOrigin) {
              if ("navigate" in client) {
                return client.navigate(url);
              }
              return client.focus();
            }
          } catch {
            /* ignore malformed client URL */
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
