import { describe, expect, it } from "vitest";
import {
  buildOrderPayload,
  cartItemCount,
  cartTotal,
  mergeCartLine,
  mergeOrderPayload,
  orderLineKey,
  parseCartJson,
  parseOrderPayload,
  updateCartLineQty,
  type OrderLine,
} from "./menu-cart";

const baseLine: OrderLine = {
  itemId: "item1",
  name: "Σαλάτα",
  quantity: 1,
  unitPrice: "10",
};

describe("orderLineKey", () => {
  it("treats same item with different extras as separate lines", () => {
    const a = orderLineKey({ itemId: "i1", extraIds: ["ex_b"], note: "χωρίς κρεμμύδι" });
    const b = orderLineKey({ itemId: "i1", extraIds: ["ex_a"], note: "χωρίς κρεμμύδι" });
    expect(a).not.toBe(b);
  });

  it("ignores extra id order", () => {
    const a = orderLineKey({ itemId: "i1", extraIds: ["ex_a", "ex_b"] });
    const b = orderLineKey({ itemId: "i1", extraIds: ["ex_b", "ex_a"] });
    expect(a).toBe(b);
  });
});

describe("mergeCartLine", () => {
  it("merges identical lines and caps quantity at 99", () => {
    const merged = mergeCartLine([baseLine], { ...baseLine, quantity: 2 });
    expect(merged).toHaveLength(1);
    expect(merged[0]?.quantity).toBe(3);

    const many = mergeCartLine([{ ...baseLine, quantity: 98 }], { ...baseLine, quantity: 5 });
    expect(many[0]?.quantity).toBe(99);
  });

  it("updates unit price when merging (server-trusted price wins)", () => {
    const merged = mergeCartLine([baseLine], { ...baseLine, unitPrice: "12", quantity: 1 });
    expect(merged[0]?.unitPrice).toBe("12");
  });
});

describe("cart totals", () => {
  it("computes total and item count", () => {
    const lines = [
      { ...baseLine, quantity: 2, unitPrice: "4.5" },
      { ...baseLine, itemId: "item2", unitPrice: "3", quantity: 1 },
    ];
    expect(cartTotal(lines)).toBe("12");
    expect(cartItemCount(lines)).toBe(3);
  });

  it("builds payload with recalculated total", () => {
    const payload = buildOrderPayload([{ ...baseLine, unitPrice: "8.50", quantity: 2 }], "GR");
    expect(payload.total).toBe("17");
    expect(payload.lang).toBe("GR");
  });
});

describe("parseCartJson", () => {
  it("drops malformed lines and rejects bad prices", () => {
    const raw = JSON.stringify([
      baseLine,
      { ...baseLine, unitPrice: "8,50" },
      { itemId: "", name: "x", quantity: 1, unitPrice: "1" },
    ]);
    expect(parseCartJson(raw)).toHaveLength(1);
  });
});

describe("mergeOrderPayload", () => {
  it("merges pending order with new lines", () => {
    const existing = buildOrderPayload([baseLine]);
    const incoming = buildOrderPayload([{ ...baseLine, itemId: "item2", unitPrice: "5" }]);
    const merged = mergeOrderPayload(existing, incoming);
    expect(merged.lines).toHaveLength(2);
    expect(merged.total).toBe("15");
  });
});

describe("parseOrderPayload", () => {
  it("accepts legacy demo lines with qty and no itemId", () => {
    const parsed = parseOrderPayload({
      lines: [{ name: "Μουσακάς", qty: 2, unitPrice: "12.00" }],
      total: "24.00",
    });
    expect(parsed?.lines[0]).toMatchObject({
      name: "Μουσακάς",
      quantity: 2,
      unitPrice: "12.00",
      itemId: "legacy:Μουσακάς",
    });
  });
});

describe("updateCartLineQty", () => {
  it("removes line when quantity goes below 1", () => {
    const key = orderLineKey(baseLine);
    expect(updateCartLineQty([baseLine], key, 0)).toHaveLength(0);
  });
});
