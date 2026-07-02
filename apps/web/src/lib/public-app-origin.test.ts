import { describe, expect, it } from "vitest";
import { isUnreachableBrowserHost, resolvePublicOrigin } from "./public-app-origin";

describe("public-app-origin", () => {
  it("detects unreachable bind addresses", () => {
    expect(isUnreachableBrowserHost("0.0.0.0")).toBe(true);
    expect(isUnreachableBrowserHost("[::]")).toBe(true);
    expect(isUnreachableBrowserHost("menuos.gr")).toBe(false);
  });

  it("replaces 0.0.0.0 origin with public APP_URL", () => {
    process.env.APP_URL = "https://menuos.gr";
    expect(resolvePublicOrigin("http://0.0.0.0:3000")).toBe("https://menuos.gr");
  });

  it("keeps reachable origins", () => {
    expect(resolvePublicOrigin("https://menuos.gr")).toBe("https://menuos.gr");
  });

  it("prefers x-forwarded-host on requests", () => {
    const req = new Request("http://0.0.0.0:3000/api/staff/session", {
      headers: {
        "x-forwarded-host": "menuos.gr",
        "x-forwarded-proto": "https",
      },
    });
    expect(resolvePublicOrigin(req)).toBe("https://menuos.gr");
  });
});
