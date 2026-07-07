import { ImageResponse } from "next/og";
import { CheckoutLogoImage } from "@/lib/checkout-brand-images";

export const runtime = "edge";

/** Horizontal logo for Stripe Checkout header — URL must end with .png for Stripe. */
export async function GET() {
  return new ImageResponse(<CheckoutLogoImage />, { width: 560, height: 120 });
}
