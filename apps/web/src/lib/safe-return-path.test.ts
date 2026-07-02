import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./safe-return-path";

describe("safeReturnPath", () => {
  it("accepts normal paths", () => {
    expect(safeReturnPath("/dashboard/billing")).toBe("/dashboard/billing");
    expect(safeReturnPath("/dashboard?x=1")).toBe("/dashboard?x=1");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeReturnPath("//evil.com")).toBe("/dashboard/billing");
    expect(safeReturnPath("https://evil.com")).toBe("/dashboard/billing");
    expect(safeReturnPath("/path://evil")).toBe("/dashboard/billing");
  });

  it("falls back for invalid input", () => {
    expect(safeReturnPath(null)).toBe("/dashboard/billing");
    expect(safeReturnPath("dashboard")).toBe("/dashboard/billing");
  });
});
