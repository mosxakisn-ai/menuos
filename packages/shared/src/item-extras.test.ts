import { describe, expect, it } from "vitest";
import {
  computeItemUnitPrice,
  filterValidExtraIds,
  formatExtraPriceSuffix,
  parseItemExtras,
  resolveExtraLabels,
  sumExtraPrices,
} from "./item-extras";

const config = parseItemExtras([
  { id: "ex_salt", labels: { GR: "Χωρίς αλάτι" } },
  { id: "ex_cheese", labels: { GR: "Extra τυρί", EN: "Extra cheese" }, price: 2 },
  { id: "bad", labels: { GR: "" } },
]);

describe("parseItemExtras", () => {
  it("keeps valid extras and drops invalid entries", () => {
    expect(config).toHaveLength(2);
    expect(config[0]?.id).toBe("ex_salt");
    expect(config[1]?.price).toBe(2);
  });

  it("returns empty for non-array input", () => {
    expect(parseItemExtras(null)).toEqual([]);
  });
});

describe("extra pricing", () => {
  it("sums only selected extra prices", () => {
    expect(sumExtraPrices(config, ["ex_cheese"])).toBe(2);
    expect(sumExtraPrices(config, ["ex_salt", "ex_cheese"])).toBe(2);
    expect(sumExtraPrices(config, ["ex_unknown"])).toBe(0);
  });

  it("computes unit price with base + extras", () => {
    expect(computeItemUnitPrice("8", config, ["ex_cheese"])).toBe("10");
    expect(computeItemUnitPrice("8.5", config, [])).toBe("8.50");
    expect(computeItemUnitPrice({ toString: () => "4.5" }, config, ["ex_cheese"])).toBe("6.50");
  });

  it("formats price suffix for paid extras only", () => {
    expect(formatExtraPriceSuffix(config[0]!)).toBeNull();
    expect(formatExtraPriceSuffix(config[1]!)).toBe("+€2");
  });
});

describe("resolveExtraLabels", () => {
  it("returns labels in request order for valid ids", () => {
    expect(resolveExtraLabels(config, ["ex_cheese", "ex_salt"], "EN")).toEqual([
      "Extra cheese",
      "Χωρίς αλάτι",
    ]);
  });

  it("filters unknown ids", () => {
    expect(filterValidExtraIds(config, ["ex_cheese", "ex_unknown"])).toEqual(["ex_cheese"]);
  });
});
