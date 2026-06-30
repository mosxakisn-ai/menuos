import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import {
  changeSupervisorOperatorOwnPassword,
  findSupervisorOperatorByUsername,
} from "@/lib/supervisor-operator-service";
import { supervisorChangeOwnPasswordSchema } from "@/lib/supervisor-schemas";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const username = auth.supervisor!.username;
  const ip = clientIp(request);
  const ipLimit = await checkRateLimitOutcome(`supervisor-change-password:ip:${ip}`, 20, 15 * 60 * 1000);
  if (ipLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (ipLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }
  const userLimit = await checkRateLimitOutcome(
    `supervisor-change-password:user:${username.toLowerCase()}`,
    10,
    15 * 60 * 1000,
  );
  if (userLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (userLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = supervisorChangeOwnPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "confirmPassword") {
      return NextResponse.json(
        { error: "Ο νέος κωδικός και η επιβεβαίωση δεν ταιριάζουν." },
        { status: 400 },
      );
    }
    if (issue?.path[0] === "newPassword" && issue.message.includes("differ")) {
      return NextResponse.json(
        { error: "Ο νέος κωδικός πρέπει να διαφέρει από τον τρέχοντα." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες." },
      { status: 400 },
    );
  }

  const operator = await findSupervisorOperatorByUsername(username);
  if (!operator) {
    return NextResponse.json(
      {
        error: "Ο λογαριασμός σου είναι από .env — η αλλαγή γίνεται στο server config.",
        code: "env_only",
      },
      { status: 400 },
    );
  }

  try {
    await changeSupervisorOperatorOwnPassword(
      username,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    return NextResponse.json({ ok: true, message: "Ο κωδικός άλλαξε." });
  } catch (err) {
    if (err instanceof Error && err.message === "wrong_password") {
      return NextResponse.json({ error: "Ο τρέχων κωδικός είναι λάθος." }, { status: 401 });
    }
    console.error("[menuos-supervisor] change own password", err);
    return NextResponse.json({ error: "Αποτυχία αλλαγής." }, { status: 500 });
  }
}
