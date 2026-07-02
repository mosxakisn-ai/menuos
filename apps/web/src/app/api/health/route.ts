import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { isMailConfigured } from "@/lib/mail";
import { isPdfVisionConfigured } from "@/lib/pdf-vision-gemini";

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {
    database: "fail",
    mail: isMailConfigured() ? "ok" : "fail",
    gemini: isPdfVisionConfigured() ? "ok" : "fail",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    console.error("[menuos-health] database check failed", err);
  }

  const hints: string[] = [];
  if (checks.database === "fail") {
    hints.push("Η βάση δεδομένων δεν απαντά — έλεγξε Postgres και DATABASE_URL στο server.");
  }
  if (checks.mail === "fail") {
    hints.push("Ρύθμισε MAILBOX_PASSWORD στο .env για αποστολή email.");
  }
  if (checks.gemini === "fail") {
    hints.push("GEMINI_API_KEY κενό — PDF AI (Vision + μετάφραση) απενεργοποιημένο.");
  }

  const healthy = checks.database === "ok";

  return NextResponse.json(
    {
      ok: healthy,
      checks,
      hint: hints[0],
      hints: hints.length > 0 ? hints : undefined,
    },
    { status: healthy ? 200 : 503 },
  );
}
