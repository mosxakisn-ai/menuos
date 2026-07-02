self.addEventListener("push", (event) => {
  let data = { title: "MenuOS", body: "", url: "/" };
  try {
    data = { ...data, ...event.data?.json() };
  } catch {
    /* ignore malformed payload */
  }

  event.waitUntil(
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
