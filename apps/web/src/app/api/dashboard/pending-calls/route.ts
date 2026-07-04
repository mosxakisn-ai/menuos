import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireLive360Plan } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireLive360Plan();
  if (auth.response) return auth.response;

  const organizationId = auth.session!.organizationId;

  const [pendingCount, passCount] = await Promise.all([
    prisma.waiterCall.count({
      where: {
        venue: { organizationId },
        status: "PENDING",
      },
    }),
    prisma.passSignal.count({
      where: {
        venue: { organizationId },
        status: { in: ["READY", "PICKED_UP"] },
      },
    }),
  ]);

  return NextResponse.json({
    pendingCount,
    passCount,
    activeCount: pendingCount + passCount,
  });
}
