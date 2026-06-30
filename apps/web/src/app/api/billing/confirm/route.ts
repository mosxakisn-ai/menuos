import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getOrganizationSubscription, isCheckoutPlan } from "@/lib/billing";
import {
  activateSubscriptionFromCheckoutSession,
  isMenuOsStripeMetadata,
  isStripeEnabled,
  stripeGetSession,
  stripeGetSubscription,
} from "@/lib/stripe-client";

export async function POST(request: Request) {
  const auth = await requireSession({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Το Stripe δεν είναι ρυθμισμένο." }, { status: 503 });
  }

  let body: { sessionId?: string; organizationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const { sessionId, organizationId } = body;
  if (!sessionId || !organizationId) {
    return NextResponse.json({ error: "Απαιτούνται sessionId και organizationId." }, { status: 400 });
  }
  if (auth.session!.organizationId !== organizationId) {
    return NextResponse.json({ error: "Δεν έχεις δικαίωμα." }, { status: 403 });
  }

  try {
    const session = await stripeGetSession(sessionId);
    if (!isMenuOsStripeMetadata(session.metadata)) {
      return NextResponse.json({ error: "Δεν είναι πληρωμή MenuOS." }, { status: 400 });
    }
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return NextResponse.json({ error: "Η πληρωμή δεν ολοκληρώθηκε." }, { status: 400 });
    }
    if (session.metadata?.organizationId !== organizationId) {
      return NextResponse.json({ error: "Δεν έχεις δικαίωμα." }, { status: 403 });
    }

    if (session.mode !== "subscription") {
      return NextResponse.json({ error: "Δεν είναι checkout συνδρομής.", code: "invalid_mode" }, { status: 400 });
    }

    const planId = session.metadata?.planId;
    if (!planId || !isCheckoutPlan(planId)) {
      return NextResponse.json({ error: "Μη έγκυρο πλάνο συνδρομής.", code: "invalid_plan" }, { status: 400 });
    }

    if (typeof session.subscription !== "string") {
      return NextResponse.json({ error: "Λείπει η συνδρομή.", code: "missing_subscription" }, { status: 400 });
    }

    const sub = await stripeGetSubscription(session.subscription);
    if (typeof sub.current_period_end !== "number") {
      return NextResponse.json(
        { error: "Δεν επιβεβαιώθηκε η περίοδος συνδρομής.", code: "period_unverified" },
        { status: 502 },
      );
    }

    await activateSubscriptionFromCheckoutSession({
      organizationId,
      planId,
      stripeCustomerId: session.customer,
      stripeSubId: session.subscription,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      sendActivationEmail: true,
    });

    const subscription = await getOrganizationSubscription(organizationId);
    if (!subscription || subscription.status !== "ACTIVE" || subscription.plan !== planId) {
      return NextResponse.json(
        { error: "Η ενεργοποίηση συνδρομής απέτυχε.", code: "activation_failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, subscription });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Η επιβεβαίωση απέτυχε." },
      { status: 500 },
    );
  }
}
