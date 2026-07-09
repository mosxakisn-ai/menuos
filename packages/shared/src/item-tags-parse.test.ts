import { describe, expect, it } from "vitest";
import { parseAllergenCodes } from "./item-allergen-codes";
import { parseDietaryTags } from "./item-dietary-tags";

describe("parseDietaryTags", () => {
  it("parses valid unique tags", () => {
    expect(parseDietaryTags(["VEGETARIAN", "SPICY", "VEGETARIAN"])).toEqual([
      "VEGETARIAN",
      "SPICY",
    ]);
  });

  it("returns empty for invalid input", () => {
    expect(parseDietaryTags(null)).toEqual([]);
    expect(parseDietaryTags(["NOT_A_TAG"])).toEqual([]);
  });
});

describe("parseAllergenCodes", () => {
  it("parses valid allergen codes", () => {
    expect(parseAllergenCodes(["GLUTEN", "MILK"])).toEqual(["GLUTEN", "MILK"]);
  });

  it("ignores unknown codes", () => {
    expect(parseAllergenCodes(["GLUTEN", "UNKNOWN"])).toEqual(["GLUTEN"]);
  });
});
