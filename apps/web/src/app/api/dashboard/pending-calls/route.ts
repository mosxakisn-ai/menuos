import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const pendingCount = await prisma.waiterCall.count({
    where: {
      venue: { organizationId: auth.session!.organizationId },
      status: "PENDING",
    },
  });

  return NextResponse.json({ pendingCount });
}
