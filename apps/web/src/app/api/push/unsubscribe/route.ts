import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { pushUnsubscribeSchema } from "@menuos/shared";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = pushUnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      endpoint: parsed.data.endpoint,
      userId: auth.session!.userId,
    },
  });

  return NextResponse.json({ ok: true });
}
