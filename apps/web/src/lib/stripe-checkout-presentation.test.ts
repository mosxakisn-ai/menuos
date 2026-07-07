import { describe, expect, it } from "vitest";
import { getPlan } from "@menuos/shared";
import {
  buildSubscriptionCheckoutCopy,
  formatCheckoutFeatureLine,
} from "./stripe-checkout-presentation";

describe("formatCheckoutFeatureLine", () => {
  it("joins features and strips Gemini AI", () => {
    const line = formatCheckoutFeatureLine([
      "3 καταστήματα",
      "Εισαγωγή PDF · Gemini AI",
      "Προτεραιότητα",
      "Κλήση σερβιτόρου",
    ]);
    expect(line).toContain("3 καταστήματα");
    expect(line).toContain("Εισαγωγή PDF");
    expect(line).toContain("Κλήση σερβιτόρου");
    expect(line).not.toContain("Gemini");
    expect(line).not.toContain("Προτεραιότητα");
  });
});

describe("buildSubscriptionCheckoutCopy", () => {
  it("uses short premium product name", () => {
    const copy = buildSubscriptionCheckoutCopy(getPlan("PRO"));
    expect(copy.name).toBe("MenuOS Pro");
    expect(copy.name).not.toContain("monthly");
  });

  it("keeps description compact with Greek price", () => {
    const copy = buildSubscriptionCheckoutCopy(getPlan("PRO"), {
      catalogTagline: "Για ξενοδοχεία και επιχειρήσεις με πολλαπλούς χώρους.",
    });
    expect(copy.description).toContain("Για ξενοδοχεία");
    expect(copy.description).toContain("€19,99/μήνα");
    expect(copy.description.split("\n").length).toBeLessThanOrEqual(4);
  });
});
