import { describe, expect, it } from "vitest";
import { cuisineTypeQrLabel, isCuisineType } from "./cuisine-type";

describe("cuisine-type", () => {
  it("labels Mediterranean in four QR languages", () => {
    expect(cuisineTypeQrLabel("MEDITERRANEAN", "GR")).toBe("Μεσογειακή κουζίνα");
    expect(cuisineTypeQrLabel("MEDITERRANEAN", "EN")).toBe("Mediterranean cuisine");
  });

  it("validates cuisine type ids", () => {
    expect(isCuisineType("GOURMET")).toBe(true);
    expect(isCuisineType("INVALID")).toBe(false);
  });
});
