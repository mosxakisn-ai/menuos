import { describe, expect, it } from "vitest";

import {
  isShowcaseJunkSpotLabel,
  isShowcaseJunkStationScreenLabel,
  isShowcaseJunkWaiterLocation,
} from "./showcase-junk";

describe("showcase-junk", () => {
  it("flags paralia and orofos demo labels", () => {
    expect(isShowcaseJunkSpotLabel("paralia-1")).toBe(true);
    expect(isShowcaseJunkSpotLabel("Όροφος-1")).toBe(true);
    expect(isShowcaseJunkSpotLabel("orofos-2")).toBe(true);
    expect(isShowcaseJunkSpotLabel("12")).toBe(false);
    expect(isShowcaseJunkSpotLabel("Αυλή-1")).toBe(false);
    expect(isShowcaseJunkSpotLabel("Αυλή-1", { includeAuli: true })).toBe(true);
  });

  it("flags junk waiter locations", () => {
    expect(isShowcaseJunkWaiterLocation({ sunbedNumber: "paralia-1" })).toBe(true);
    expect(isShowcaseJunkWaiterLocation({ tableNumber: "Όροφος-1" })).toBe(true);
    expect(isShowcaseJunkWaiterLocation({ tableNumber: "11" })).toBe(false);
  });

  it("flags paralia station screen", () => {
    expect(isShowcaseJunkStationScreenLabel("Παραλία")).toBe(true);
    expect(isShowcaseJunkStationScreenLabel("Κουζίνα")).toBe(false);
  });
});
