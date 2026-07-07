import { describe, expect, it } from "vitest";
import {
  MENU_AUTO_TRANSLATE_LANGS,
  mergeAutoTranslatedNames,
  missingMenuNameLanguages,
} from "./menu-auto-translate";

describe("missingMenuNameLanguages", () => {
  it("returns all targets when only Greek is set", () => {
    expect(missingMenuNameLanguages({ nameGr: "Κυρίως πιάτα" })).toEqual([
      ...MENU_AUTO_TRANSLATE_LANGS,
    ]);
  });

  it("skips languages already provided", () => {
    expect(
      missingMenuNameLanguages({ nameGr: "Σαλάτες", nameEn: "Salads", nameDe: "Salate" }),
    ).toEqual(["FR", "PL", "CS", "IT", "SV", "FI", "TR"]);
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
