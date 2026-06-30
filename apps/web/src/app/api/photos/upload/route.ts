import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/api-auth";
import { optimizeMenuPhoto } from "@/lib/image-optimize";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";
import { getR2PublicUrl, isR2Enabled } from "@/lib/r2-config";
import { uploadToR2 } from "@/lib/r2-storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!isR2Enabled()) {
    return NextResponse.json(
      { error: "Το ανέβασμα φωτογραφιών δεν είναι ενεργό ακόμα. Χρησιμοποίησε URL.", code: "upload_disabled" },
      { status: 503 },
    );
  }

  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const ip = clientIp(request);
  const rateKey = `photo-upload:${auth.session!.organizationId}:${ip}`;
  const rateLimit = await checkRateLimitOutcome(rateKey, 30, 60_000);
  if (rateLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (rateLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε σε λίγο.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Δεν βρέθηκε αρχείο." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Μέγιστο μέγεθος 5 MB." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Μόνο JPG, PNG ή WebP." }, { status: 400 });
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeMenuPhoto(raw);
    const key = `photos/${auth.session!.organizationId}/${randomUUID()}.webp`;
    await uploadToR2(key, optimized, "image/webp");
    return NextResponse.json({ url: getR2PublicUrl(key) });
  } catch (err) {
    console.error("[menuos-photo-upload]", err);
    return NextResponse.json({ error: "Αποτυχία ανεβάσματος. Δοκίμασε ξανά." }, { status: 500 });
  }
}
