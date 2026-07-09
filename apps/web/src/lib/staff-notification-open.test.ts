import { describe, expect, it } from "vitest";
import {
  clientMatchesNotificationTarget,
  isWaiterPanelPathname,
  pushTagKind,
  resolveNotificationOpenTarget,
  staffPushNotificationSilent,
} from "./staff-notification-open";

const ORIGIN = "https://menuos.gr";

describe("resolveNotificationOpenTarget", () => {
  it("parses staff waiter URL with key", () => {
    const target = resolveNotificationOpenTarget(
      "https://menuos.gr/s/hellas-taverna?key=abc-123",
      ORIGIN,
    );
    expect(target.path).toBe("/s/hellas-taverna?key=abc-123");
    expect(target.waiterSlug).toBe("hellas-taverna");
  });

  it("falls back to origin root for invalid input", () => {
    const target = resolveNotificationOpenTarget("", ORIGIN);
    expect(target.path).toBe("/");
    expect(target.href).toBe("https://menuos.gr/");
  });
});

describe("clientMatchesNotificationTarget", () => {
  it("matches existing session tab without key query", () => {
    const target = resolveNotificationOpenTarget(
      "https://menuos.gr/s/hellas-taverna?key=member-token",
      ORIGIN,
    );
    expect(
      clientMatchesNotificationTarget("https://menuos.gr/s/hellas-taverna", target),
    ).toBe(true);
  });

  it("rejects different venue slug", () => {
    const target = resolveNotificationOpenTarget(
      "https://menuos.gr/s/hellas-taverna?key=member-token",
      ORIGIN,
    );
    expect(
      clientMatchesNotificationTarget("https://menuos.gr/s/other-venue", target),
    ).toBe(false);
  });
});

describe("pushTagKind", () => {
  it("classifies pass and waiter pushes", () => {
    expect(pushTagKind("pass-abc")).toBe("pass");
    expect(pushTagKind("waiter-xyz")).toBe("waiter");
    expect(pushTagKind("menuos-waiter")).toBe("other");
  });
});

describe("isWaiterPanelPathname", () => {
  it("recognizes staff and dashboard waiter paths", () => {
    expect(isWaiterPanelPathname("/s/demo-taverna")).toBe(true);
    expect(isWaiterPanelPathname("/dashboard/waiter")).toBe(true);
    expect(isWaiterPanelPathname("/")).toBe(false);
  });
});

describe("staffPushNotificationSilent", () => {
  it("keeps OS sound for non-staff pushes", () => {
    expect(
      staffPushNotificationSilent({
        staffPush: false,
        audioSource: "sw",
        swBeepPlayed: false,
      }),
    ).toBe(false);
  });

  it("mutes OS sound when visible panel handles audio", () => {
    expect(
      staffPushNotificationSilent({
        staffPush: true,
        audioSource: "panel",
        swBeepPlayed: false,
      }),
    ).toBe(true);
  });

  it("falls back to OS sound when SW beep fails in background", () => {
    expect(
      staffPushNotificationSilent({
        staffPush: true,
        audioSource: "sw",
        swBeepPlayed: false,
      }),
    ).toBe(false);
  });

  it("mutes OS sound when SW beep succeeds", () => {
    expect(
      staffPushNotificationSilent({
        staffPush: true,
        audioSource: "sw",
        swBeepPlayed: true,
      }),
    ).toBe(true);
  });
});
