import { NextResponse } from "next/server";
import { isR2Enabled } from "@/lib/r2-config";

export async function GET() {
  return NextResponse.json({ uploadEnabled: isR2Enabled() });
}
