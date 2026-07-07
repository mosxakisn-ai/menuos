import { describe, expect, it } from "vitest";
import { buildPassVoiceAnnouncement } from "./pass-message-voice";

describe("buildPassVoiceAnnouncement", () => {
  it("speaks table, station and translated preset in English", () => {
    expect(
      buildPassVoiceAnnouncement({
        tableNumber: "12",
        station: "kitchen",
        message: "Κουζίνα: Σερβιρίστηκε",
      }),
    ).toBe("Table 12, kitchen, served");
  });

  it("keeps ASCII message as-is", () => {
    expect(
      buildPassVoiceAnnouncement({
        tableNumber: "5",
        message: "Bar: Bring ice",
      }),
    ).toBe("Table 5, Bar, Bring ice");
  });

  it("falls back for unknown Greek text", () => {
    expect(
      buildPassVoiceAnnouncement({
        tableNumber: "3",
        message: "Κάτι άγνωστο",
      }),
    ).toBe("Table 3, new message");
  });

  it("returns null without message", () => {
    expect(buildPassVoiceAnnouncement({ tableNumber: "1", message: "  " })).toBeNull();
  });
});
