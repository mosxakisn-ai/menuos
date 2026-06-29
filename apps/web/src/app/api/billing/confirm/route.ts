import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getOrganizationSubscription } from "@/lib/billing";
import {
  activateSubscriptionFromCheckoutSession,
  isMenuOsStripeMetadata,
  isStripeEnabled,
  stripeGetSession,
} from "@/lib/stripe-client";

export async function POST(request: Request) {
  const auth = await requireSession({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  let body: { sessionId?: string; organizationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId, organizationId } = body;
  if (!sessionId || !organizationId) {
    return NextResponse.json({ error: "sessionId and organizationId required" }, { status: 400 });
  }
  if (auth.session!.organizationId !== organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const session = await stripeGetSession(sessionId);
    if (!isMenuOsStripeMetadata(session.metadata)) {
      return NextResponse.json({ error: "Not a MenuOS payment session" }, { status: 400 });
    }
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }
    if (session.metadata?.organizationId && session.metadata.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const planId = session.metadata?.planId;
    if (session.mode === "subscription" && planId) {
      await activateSubscriptionFromCheckoutSession({
        organizationId,
        planId,
        stripeCustomerId: session.customer,
        stripeSubId: session.subscription,
      });
    }

    const subscription = await getOrganizationSubscription(organizationId);
    return NextResponse.json({ ok: true, subscription });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 500 },
    );
  }
}
