import { describe, expect, it } from "vitest";
import { normalizeAnnouncementText } from "./pass-announcement-audio";

describe("normalizeAnnouncementText", () => {
  it("accepts Greek pass announcement lines", () => {
    expect(normalizeAnnouncementText("στη σάλα στο τραπέζι 5 έχετε νέο μήνυμα")).toBe(
      "στη σάλα στο τραπέζι 5 έχετε νέο μήνυμα",
    );
    expect(normalizeAnnouncementText("στην αυλή στο τραπέζι 1 έχετε νέο μήνυμα")).toBe(
      "στην αυλή στο τραπέζι 1 έχετε νέο μήνυμα",
    );
  });

  it("rejects empty or unsafe input", () => {
    expect(normalizeAnnouncementText("")).toBeNull();
    expect(normalizeAnnouncementText("<script>")).toBeNull();
  });
});
