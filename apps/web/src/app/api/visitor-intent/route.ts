import { NextResponse } from "next/server";
import { z } from "zod";
import {
  VISITOR_INTENT_STEPS,
  VISITOR_INTENT_SURFACES,
  clientIpFromRequest,
  recordVisitorIntent,
} from "@/lib/visitor-intent-service";

const bodySchema = z.object({
  sid: z.string().min(8).max(64),
  surface: z.enum(VISITOR_INTENT_SURFACES),
  step: z.enum(VISITOR_INTENT_STEPS),
  path: z.string().max(200).optional(),
  planId: z.string().max(20).optional(),
  visitorLabel: z.string().max(120).optional(),
  clientIp: z.string().max(45).optional(),
  referrer: z.string().max(200).optional(),
  source: z.string().max(20).optional(),
});

/** Anonymous funnel ping — fire-and-forget from marketing/register/checkout. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const ip = clientIpFromRequest(request, parsed.data.clientIp);

  const stored = await recordVisitorIntent({
    sessionId: parsed.data.sid,
    surface: parsed.data.surface,
    step: parsed.data.step,
    path: parsed.data.path,
    planId: parsed.data.planId,
    visitorLabel: parsed.data.visitorLabel,
    clientIp: ip || parsed.data.clientIp,
    referrer: parsed.data.referrer ?? request.headers.get("referer"),
    source: parsed.data.source,
  });

  return NextResponse.json({ ok: true, stored });
}
