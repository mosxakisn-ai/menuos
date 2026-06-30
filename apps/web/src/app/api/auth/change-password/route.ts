import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { changePasswordSchema } from "@menuos/shared";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { requireSession } from "@/lib/api-auth";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const ip = clientIp(request);
  const userId = auth.session!.userId;
  const ipLimit = await checkRateLimitOutcome(`change-password:ip:${ip}`, 20, 15 * 60 * 1000);
  if (ipLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (ipLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }
  const userLimit = await checkRateLimitOutcome(`change-password:user:${userId}`, 10, 15 * 60 * 1000);
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

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "confirmPassword") {
      return NextResponse.json(
        { error: "Ο νέος κωδικός και η επιβεβαίωση δεν ταιριάζουν.", code: "password_mismatch" },
        { status: 400 },
      );
    }
    if (issue?.path[0] === "newPassword" && issue.message.includes("differ")) {
      return NextResponse.json(
        { error: "Ο νέος κωδικός πρέπει να διαφέρει από τον τρέχοντα.", code: "password_same" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.", code: "invalid_password" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Δεν βρέθηκε ο λογαριασμός." }, { status: 404 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Ο τρέχων κωδικός είναι λάθος.", code: "wrong_password" },
      { status: 401 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
    select: { id: true, organizationId: true, email: true, name: true, role: true },
  });

  const token = await createSessionToken({
    userId: updated.id,
    organizationId: updated.organizationId,
    email: updated.email,
    name: updated.name,
    role: updated.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, message: "Ο κωδικός άλλαξε." });
}
