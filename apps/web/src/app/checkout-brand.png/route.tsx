import { ImageResponse } from "next/og";
import { CheckoutBrandImage } from "@/lib/checkout-brand-images";

export const runtime = "edge";

/** Square product + icon image for Stripe Checkout — URL must end with .png for Stripe. */
export async function GET() {
  return new ImageResponse(<CheckoutBrandImage />, { width: 512, height: 512 });
}
