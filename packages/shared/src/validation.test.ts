import { describe, expect, it } from "vitest";
import {
  venueSpotBulkCreateSchema,
  venueSpotCreateSchema,
  zodFirstErrorMessage,
} from "./validation";
import { itemExtrasSchema } from "./item-extras";

describe("venueSpotCreateSchema", () => {
  it("accepts valid spot labels", () => {
    expect(venueSpotCreateSchema.safeParse({ type: "TABLE", label: "sala-1" }).success).toBe(true);
  });

  it("rejects labels with spaces", () => {
    const result = venueSpotCreateSchema.safeParse({ type: "TABLE", label: "table 12" });
    expect(result.success).toBe(false);
  });
});

describe("venueSpotBulkCreateSchema", () => {
  it("accepts bulk range up to 200", () => {
    expect(
      venueSpotBulkCreateSchema.safeParse({ type: "TABLE", from: 1, to: 120, prefix: "sala-" }).success,
    ).toBe(true);
  });

  it("rejects range over 200 spots", () => {
    const result = venueSpotBulkCreateSchema.safeParse({ type: "TABLE", from: 1, to: 250 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFirstErrorMessage(result.error)).toContain("200");
    }
  });

  it("rejects when prefix + number exceeds 20 chars", () => {
    const result = venueSpotBulkCreateSchema.safeParse({
      type: "TABLE",
      from: 1,
      to: 2,
      prefix: "very-long-prefix-name-",
    });
    expect(result.success).toBe(false);
  });
});

describe("itemExtrasSchema", () => {
  it("accepts optional extra price", () => {
    const parsed = itemExtrasSchema.safeParse([
      { id: "ex_1", labels: { GR: "Extra τυρί" }, price: 2.5 },
    ]);
    expect(parsed.success).toBe(true);
  });

  it("rejects negative extra price", () => {
    expect(
      itemExtrasSchema.safeParse([{ id: "ex_1", labels: { GR: "x" }, price: -1 }]).success,
    ).toBe(false);
  });
});
