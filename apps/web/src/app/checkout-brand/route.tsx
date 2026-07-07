import { NextResponse } from "next/server";

export const runtime = "edge";

/** Legacy path — Stripe requires image URLs with a file extension. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/checkout-brand.png", request.url), 308);
}
