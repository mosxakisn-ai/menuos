import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { loginSchema } from "@menuos/shared";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const ip = clientIp(request);
  const ipLimit = await checkRateLimitOutcome(`login:ip:${ip}`, 30, 15 * 60 * 1000);
  if (ipLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (ipLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }
  const emailLimit = await checkRateLimitOutcome(`login:email:${parsed.data.email}`, 10, 15 * 60 * 1000);
  if (emailLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (emailLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: "Λάθος email ή κωδικός." }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Λάθος email ή κωδικός." }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
