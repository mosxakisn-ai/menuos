import { describe, expect, it } from "vitest";
import { parseVisionMenuJson } from "@/lib/pdf-vision-gemini";

describe("parseVisionMenuJson", () => {
  it("normalizes Gemini menu JSON", () => {
    const sections = parseVisionMenuJson({
      sections: [
        {
          title: "ΜΕΖΕΔΕΣ",
          titleEn: "STARTERS",
          items: [
            { name: "Τζατζίκι", nameEn: "Tzatziki", price: "7.40" },
            { name: "Invalid", price: null },
          ],
        },
      ],
    });

    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe("ΜΕΖΕΔΕΣ");
    expect(sections[0]?.items).toHaveLength(1);
    expect(sections[0]?.items[0]?.price).toBe(7.4);
  });
});
