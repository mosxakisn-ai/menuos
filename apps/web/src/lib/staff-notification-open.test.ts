import { describe, expect, it } from "vitest";
import {
  clientMatchesNotificationTarget,
  isWaiterPanelPathname,
  pushTagKind,
  resolveNotificationOpenTarget,
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
