import { NextResponse } from "next/server";
import { isPhotoUploadEnabled } from "@/lib/photo-storage";

export async function GET() {
  return NextResponse.json({ uploadEnabled: isPhotoUploadEnabled() });
}
