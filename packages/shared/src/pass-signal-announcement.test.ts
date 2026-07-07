import { describe, expect, it } from "vitest";
import { groupVenueSpotsByZone } from "./station-spot-zones";
import {
  buildPassSignalAnnouncement,
  buildPassSignalPushCopy,
  zoneLocationPhrase,
} from "./pass-signal-announcement";

describe("zoneLocationPhrase", () => {
  it("uses natural prepositions for common zones", () => {
    expect(zoneLocationPhrase("Κήπο")).toBe("στον κήπο");
    expect(zoneLocationPhrase("Αυλή")).toBe("στην αυλή");
    expect(zoneLocationPhrase("Σαλα")).toBe("στη σάλα");
  });
});

describe("buildPassSignalAnnouncement", () => {
  const groups = groupVenueSpotsByZone([
    { type: "TABLE", label: "Σαλα-1" },
    { type: "TABLE", label: "Σαλα-12" },
    { type: "TABLE", label: "Αυλή-2" },
    { type: "TABLE", label: "Κήπο-10" },
    { type: "ROOM", label: "101" },
    { type: "SUNBED", label: "7" },
  ]);

  it("parses prefixed table label without configured spots", () => {
    expect(buildPassSignalAnnouncement({ tableNumber: "Κήπο-10" })).toBe(
      "στον κήπο στο τραπέζι 10 έχετε νέο μήνυμα",
    );
  });

  it("announces zone and table from spot config", () => {
    expect(
      buildPassSignalAnnouncement({ tableNumber: "Σαλα-12" }, { zoneGroups: groups }),
    ).toBe("στη σάλα στο τραπέζι 12 έχετε νέο μήνυμα");
  });

  it("uses KDS zone hint for bare table numbers", () => {
    expect(
      buildPassSignalAnnouncement(
        { tableNumber: "10" },
        { zoneGroups: groups, activeZoneId: "prefix:κήπο" },
      ),
    ).toBe("στον κήπο στο τραπέζι 10 έχετε νέο μήνυμα");
  });

  it("resolves bare table number inside active zone", () => {
    expect(
      buildPassSignalAnnouncement(
        { tableNumber: "1" },
        { zoneGroups: groups, activeZoneId: "prefix:σαλα" },
      ),
    ).toBe("στη σάλα στο τραπέζι 1 έχετε νέο μήνυμα");
  });

  it("announces main-zone table without space name", () => {
    const mainOnly = groupVenueSpotsByZone([{ type: "TABLE", label: "12" }]);
    expect(buildPassSignalAnnouncement({ tableNumber: "12" }, { zoneGroups: mainOnly })).toBe(
      "στο τραπέζι 12 έχετε νέο μήνυμα",
    );
  });

  it("announces room and sunbed", () => {
    expect(buildPassSignalAnnouncement({ roomNumber: "101" }, { zoneGroups: groups })).toBe(
      "στο δωμάτιο 101 έχετε νέο μήνυμα",
    );
    expect(buildPassSignalAnnouncement({ sunbedNumber: "7" }, { zoneGroups: groups })).toBe(
      "στη ξαπλώστρα 7 έχετε νέο μήνυμα",
    );
  });

  it("falls back without configured spots", () => {
    expect(buildPassSignalAnnouncement({ tableNumber: "5" })).toBe(
      "στο τραπέζι 5 έχετε νέο μήνυμα",
    );
  });

  it("splits push title and location body", () => {
    expect(
      buildPassSignalPushCopy({ tableNumber: "Κήπο-10" }, { zoneGroups: groups }),
    ).toEqual({
      title: "Νέο μήνυμα",
      body: "στον κήπο στο τραπέζι 10",
    });
  });
});
