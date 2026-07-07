import { describe, expect, it } from "vitest";
import { userFacingCheckoutError } from "./stripe-checkout-errors";

describe("userFacingCheckoutError", () => {
  it("maps logo URL validation to Greek message", () => {
    expect(
      userFacingCheckoutError(
        new Error("The logo URL path must end with `.png`, `.jpg`, `.jpeg`."),
      ),
    ).toContain("Προσωρινό πρόβλημα");
  });

  it("maps API key errors to support message", () => {
    expect(userFacingCheckoutError(new Error("Invalid API Key provided"))).toContain("υποστήριξη");
  });

  it("falls back to generic Greek checkout error", () => {
    expect(userFacingCheckoutError(new Error("something unexpected"))).toContain("Δεν ήταν δυνατή");
  });
});
