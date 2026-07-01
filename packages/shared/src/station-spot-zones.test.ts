import { describe, expect, it } from "vitest";
import { groupVenueSpotsByZone, pickDefaultZoneId } from "./station-spot-zones";

describe("groupVenueSpotsByZone", () => {
  it("groups plain tables under Σαλόνι", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "12" },
      { type: "TABLE", label: "3" },
      { type: "TABLE", label: "1" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.label).toBe("Σαλόνι");
    expect(groups[0]!.spots.map((s) => s.displayLabel)).toEqual(["1", "3", "12"]);
  });

  it("splits prefixed tables into separate zones", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "5" },
      { type: "TABLE", label: "Αυλή-2" },
      { type: "TABLE", label: "Αυλή-1" },
      { type: "TABLE", label: "Όροφος-1" },
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Σαλόνι", "Αυλή", "Όροφος"]);
    expect(groups[1]!.spots.map((s) => s.displayLabel)).toEqual(["1", "2"]);
  });

  it("puts sunbeds and rooms in dedicated zones", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "1" },
      { type: "SUNBED", label: "paralia-1" },
      { type: "ROOM", label: "101" },
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Σαλόνι", "Ξαπλώστρες", "Δωμάτια"]);
  });
});

describe("pickDefaultZoneId", () => {
  it("returns first group id", () => {
    const groups = groupVenueSpotsByZone([{ type: "TABLE", label: "1" }]);
    expect(pickDefaultZoneId(groups)).toBe("main");
  });
});
