import { describe, expect, it } from "vitest";
import { buildTableGridTiles } from "./waiter-table-grid";

const spots = [
  { id: "s1", type: "TABLE" as const, label: "5" },
  { id: "s2", type: "TABLE" as const, label: "12" },
  { id: "s3", type: "TABLE" as const, label: "20" },
];

describe("buildTableGridTiles", () => {
  it("marks idle when no activity", () => {
    const tiles = buildTableGridTiles(spots, [], []);
    expect(tiles.every((t) => t.state === "idle")).toBe(true);
  });

  it("marks guest_call for pending waiter call", () => {
    const tiles = buildTableGridTiles(
      spots,
      [{ type: "WAITER", status: "PENDING", tableNumber: "12" }],
      [],
    );
    expect(tiles.find((t) => t.label === "12")?.state).toBe("guest_call");
    expect(tiles.find((t) => t.label === "5")?.state).toBe("idle");
  });

  it("marks kitchen_ready for kitchen pass", () => {
    const tiles = buildTableGridTiles(
      spots,
      [],
      [{ station: "KITCHEN", tableNumber: "5", message: "έλα πάσο" }],
    );
    expect(tiles.find((t) => t.label === "5")?.state).toBe("kitchen_ready");
  });

  it("marks cold_ready for cold pass", () => {
    const tiles = buildTableGridTiles(
      spots,
      [],
      [{ station: "COLD", tableNumber: "5", message: "σαλάτα" }],
    );
    expect(tiles.find((t) => t.label === "5")?.state).toBe("cold_ready");
  });

  it("marks bar_ready for bar pass", () => {
    const tiles = buildTableGridTiles(
      spots,
      [],
      [{ station: "BAR", tableNumber: "5", message: "ποτό" }],
    );
    expect(tiles.find((t) => t.label === "5")?.state).toBe("bar_ready");
  });

  it("marks both when guest and pass overlap", () => {
    const tiles = buildTableGridTiles(
      spots,
      [{ type: "ORDER", status: "PENDING", tableNumber: "12" }],
      [{ station: "KITCHEN", tableNumber: "12", message: "μουσακάς" }],
    );
    expect(tiles.find((t) => t.label === "12")?.state).toBe("both");
  });

  it("marks both when kitchen and bar pass on same table", () => {
    const tiles = buildTableGridTiles(
      spots,
      [],
      [
        { station: "KITCHEN", tableNumber: "5" },
        { station: "BAR", tableNumber: "5" },
      ],
    );
    expect(tiles.find((t) => t.label === "5")?.state).toBe("both");
  });

  it("matches room spots", () => {
    const roomSpots = [{ id: "r1", type: "ROOM" as const, label: "204" }];
    const tiles = buildTableGridTiles(
      roomSpots,
      [{ type: "BILL", status: "ACKNOWLEDGED", roomNumber: "204" }],
      [],
    );
    expect(tiles[0]?.state).toBe("guest_call");
  });

  it("hides unmapped tiles when spots exist (default)", () => {
    const tiles = buildTableGridTiles(
      spots,
      [{ id: "c1", type: "WAITER", status: "PENDING", tableNumber: "99" }],
      [],
    );
    expect(tiles).toHaveLength(spots.length);
    expect(tiles.some((t) => t.spotId.startsWith("__unmapped__:"))).toBe(false);
  });

  it("adds unmapped tile when call location does not match any spot", () => {
    const tiles = buildTableGridTiles(
      spots,
      [{ id: "c1", type: "WAITER", status: "PENDING", tableNumber: "99" }],
      [],
      { includeUnmapped: true },
    );
    const unmapped = tiles.find((t) => t.spotId.startsWith("__unmapped__:"));
    expect(unmapped?.label).toBe("99");
    expect(unmapped?.state).toBe("guest_call");
    expect(tiles.find((t) => t.label === "99" && !t.spotId.startsWith("__unmapped__:"))).toBeUndefined();
  });

  it("adds unmapped tile when pass location does not match any spot", () => {
    const tiles = buildTableGridTiles(
      spots,
      [],
      [{ id: "p1", station: "KITCHEN", tableNumber: "99", message: "έλα πάσο" }],
      { includeUnmapped: true },
    );
    const unmapped = tiles.find((t) => t.spotId.startsWith("__unmapped__:"));
    expect(unmapped?.label).toBe("99");
    expect(unmapped?.state).toBe("kitchen_ready");
    expect(tiles).toHaveLength(spots.length + 1);
  });

  it("shows unmapped calls when no spots are configured", () => {
    const tiles = buildTableGridTiles(
      [],
      [{ type: "ORDER", status: "PENDING", tableNumber: "8" }],
      [{ station: "KITCHEN", tableNumber: "8", message: "μουσακάς" }],
    );
    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.state).toBe("both");
  });
});
