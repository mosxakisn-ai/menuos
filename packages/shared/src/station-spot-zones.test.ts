import { describe, expect, it } from "vitest";
import {
  filterSpotsByZone,
  filterWaiterLocationsByZone,
  filterWaiterLocationsForZoneView,
  formatWaiterCallLocationWithZone,
  findZoneIdForSpot,
  groupVenueSpotsByZone,
  pickDefaultZoneId,
  passSendTableNumber,
  resolveWaiterLocationInZones,
  zoneIdForWaiterLocation,
} from "./station-spot-zones";

describe("groupVenueSpotsByZone", () => {
  it("groups plain tables under Τραπέζια", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "12" },
      { type: "TABLE", label: "3" },
      { type: "TABLE", label: "1" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.label).toBe("Τραπέζια");
    expect(groups[0]!.spots.map((s) => s.displayLabel)).toEqual(["1", "3", "12"]);
  });

  it("splits prefixed tables into separate zones", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "5" },
      { type: "TABLE", label: "Αυλή-2" },
      { type: "TABLE", label: "Αυλή-1" },
      { type: "TABLE", label: "Όροφος-1" },
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Τραπέζια", "Αυλή", "Όροφος"]);
    expect(groups[1]!.spots.map((s) => s.displayLabel)).toEqual(["1", "2"]);
  });

  it("puts sunbeds and rooms in dedicated zones", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "1" },
      { type: "SUNBED", label: "paralia-1" },
      { type: "ROOM", label: "101" },
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Τραπέζια", "Ξαπλώστρες", "Δωμάτια"]);
  });
});

describe("findZoneIdForSpot", () => {
  it("returns zone id for a spot", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "5" },
      { type: "TABLE", label: "Αυλή-1" },
    ]);
    expect(findZoneIdForSpot(groups, { type: "TABLE", label: "Αυλή-1" })).toBe("prefix:αυλή");
  });
});

describe("pickDefaultZoneId", () => {
  it("returns first group id", () => {
    const groups = groupVenueSpotsByZone([{ type: "TABLE", label: "1" }]);
    expect(pickDefaultZoneId(groups)).toBe("main");
  });
});

describe("zone filters for waiter", () => {
  it("filters spots and calls by zone", () => {
    const spots = [
      { type: "TABLE" as const, label: "5" },
      { type: "TABLE" as const, label: "Αυλή-1" },
    ];
    const groups = groupVenueSpotsByZone(spots);

    const patioSpots = filterSpotsByZone(
      spots.map((s, i) => ({ ...s, id: String(i) })),
      "prefix:αυλή",
      groups,
    );
    expect(patioSpots).toHaveLength(1);
    expect(patioSpots[0]!.label).toBe("Αυλή-1");

    const calls = [{ tableNumber: "5" }, { tableNumber: "Αυλή-1" }];
    const patioCalls = filterWaiterLocationsByZone(calls, "prefix:αυλή", groups);
    expect(patioCalls).toHaveLength(1);
    expect(zoneIdForWaiterLocation({ tableNumber: "Αυλή-1" }, groups)).toBe("prefix:αυλή");
  });

  it("maps bare table numbers to prefixed spots when unique", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "Σαλα-12" },
      { type: "TABLE", label: "Αυλή-3" },
    ]);
    expect(zoneIdForWaiterLocation({ tableNumber: "12" }, groups)).toBe("prefix:σαλα");
    expect(resolveWaiterLocationInZones({ tableNumber: "12" }, groups)?.spot.label).toBe("Σαλα-12");
  });

  it("returns null when bare table number matches multiple zones", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "Σαλα-12" },
      { type: "TABLE", label: "Αυλή-12" },
    ]);
    expect(zoneIdForWaiterLocation({ tableNumber: "12" }, groups)).toBeNull();
  });

  it("includes unmapped locations only under all zones", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "5" },
      { type: "TABLE", label: "Αυλή-1" },
    ]);
    const items = [
      { id: "c1", tableNumber: "5" },
      { id: "c2", tableNumber: "99" },
    ];
    expect(filterWaiterLocationsForZoneView(items, "prefix:αυλή", groups).map((row) => row.id)).toEqual(
      [],
    );
    expect(filterWaiterLocationsForZoneView(items, "all", groups).map((row) => row.id)).toEqual([
      "c1",
      "c2",
    ]);
    expect(filterWaiterLocationsForZoneView(items, groups[0]!.id, groups).map((row) => row.id)).toEqual([
      "c1",
    ]);
  });

  it("formats location with zone prefix for prefixed tables", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "Σαλα-1" },
      { type: "TABLE", label: "Αυλή-2" },
    ]);
    expect(formatWaiterCallLocationWithZone({ tableNumber: "Σαλα-1" }, groups)).toBe(
      "Σαλα · Τραπέζι 1",
    );
    expect(
      formatWaiterCallLocationWithZone({ tableNumber: "1" }, groups, { activeZoneId: "prefix:σαλα" }),
    ).toBe("Σαλα · Τραπέζι 1");
    expect(formatWaiterCallLocationWithZone({ tableNumber: "12" }, groups)).toBe("Τραπέζι 12");
  });

  it("disambiguates bare table numbers using active zone on pass send", () => {
    const groups = groupVenueSpotsByZone([
      { type: "TABLE", label: "Σαλα-1" },
      { type: "TABLE", label: "Αυλή-1" },
    ]);
    expect(passSendTableNumber(null, "1", "prefix:σαλα", groups)).toBe("Σαλα-1");
    expect(passSendTableNumber(null, "1", "prefix:αυλή", groups)).toBe("Αυλή-1");
    expect(zoneIdForWaiterLocation({ tableNumber: "1" }, groups)).toBeNull();
  });
});
