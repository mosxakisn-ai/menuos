import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { isMailConfigured } from "@/lib/mail";

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {
    database: "fail",
    mail: isMailConfigured() ? "ok" : "fail",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    console.error("[menuos-health] database check failed", err);
  }

  const healthy = checks.database === "ok";

  return NextResponse.json(
    {
      ok: healthy,
      checks,
      hint:
        checks.database === "fail"
          ? "Η βάση δεδομένων δεν απαντά — έλεγξε Postgres και DATABASE_URL στο server."
          : checks.mail === "fail"
            ? "Ρύθμισε MAILBOX_PASSWORD στο .env για αποστολή email."
            : undefined,
    },
    { status: healthy ? 200 : 503 },
  );
}
