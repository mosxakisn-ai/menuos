import { describe, expect, it } from "vitest";
import { mergeAutoTranslatedNames, missingMenuNameLanguages } from "./menu-auto-translate";

describe("missingMenuNameLanguages", () => {
  it("returns all targets when only Greek is set", () => {
    expect(missingMenuNameLanguages({ nameGr: "Κυρίως πιάτα" })).toEqual(["EN", "DE", "FR"]);
  });

  it("skips languages already provided", () => {
    expect(
      missingMenuNameLanguages({ nameGr: "Σαλάτες", nameEn: "Salads", nameDe: "Salate" }),
    ).toEqual(["FR"]);
  });

  it("returns empty when Greek is blank", () => {
    expect(missingMenuNameLanguages({ nameGr: "  " })).toEqual([]);
  });
});

describe("mergeAutoTranslatedNames", () => {
  it("keeps manual overrides and fills the rest", () => {
    expect(
      mergeAutoTranslatedNames(
        { nameGr: " Ποτά ", nameEn: "Custom drinks" },
        { DE: "Getränke", FR: "Boissons" },
      ),
    ).toEqual({
      nameGr: "Ποτά",
      nameEn: "Custom drinks",
      nameDe: "Getränke",
      nameFr: "Boissons",
    });
  });
});
