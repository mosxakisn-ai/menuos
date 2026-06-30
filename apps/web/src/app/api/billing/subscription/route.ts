import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getOrganizationSubscription } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const organizationId = req.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "Απαιτείται organizationId." }, { status: 400 });
  }
  if (auth.session!.organizationId !== organizationId) {
    return NextResponse.json({ error: "Δεν έχεις δικαίωμα." }, { status: 403 });
  }

  const subscription = await getOrganizationSubscription(organizationId);
  if (!subscription) {
    return NextResponse.json({ error: "Η συνδρομή δεν βρέθηκε." }, { status: 404 });
  }
  return NextResponse.json(subscription);
}
