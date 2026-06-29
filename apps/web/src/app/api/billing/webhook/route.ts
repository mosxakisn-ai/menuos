import {
  activateSubscriptionFromCheckoutSession,
  isMenuOsStripeMetadata,
  isStripeEnabled,
  verifyStripeWebhookSignature,
} from "@/lib/stripe-client";
import { isCheckoutPlan } from "@/lib/billing";
import { fireAdminNotify, notifyAdminStripePayment } from "@/lib/admin-notify";
import { NextRequest, NextResponse } from "next/server";

function sessionAmountEur(session: Record<string, unknown>): number {
  const total = session.amount_total;
  if (typeof total === "number") return Math.round(total) / 100;
  return 0;
}

export async function POST(req: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature || !verifyStripeWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type: string;
    data: { object: Record<string, unknown> };
  };

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = (session.metadata ?? {}) as Record<string, string>;

      if (!isMenuOsStripeMetadata(metadata)) {
        return NextResponse.json({ received: true, skipped: "not_menuos" });
      }

      const mode = session.mode as string;
      const paymentStatus = session.payment_status as string;

      if (
        mode === "subscription" &&
        metadata.organizationId &&
        metadata.planId &&
        isCheckoutPlan(metadata.planId) &&
        (paymentStatus === "paid" || paymentStatus === "no_payment_required")
      ) {
        await activateSubscriptionFromCheckoutSession({
          organizationId: metadata.organizationId,
          planId: metadata.planId,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubId: typeof session.subscription === "string" ? session.subscription : null,
        });

        fireAdminNotify(() =>
          notifyAdminStripePayment({
            paymentType: "subscription",
            amountEur: sessionAmountEur(session),
            organizationId: metadata.organizationId,
            customerEmail:
              typeof session.customer_email === "string" ? session.customer_email : undefined,
            sessionId: typeof session.id === "string" ? session.id : undefined,
            planId: metadata.planId,
          }),
        );
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const metadata = (subscription.metadata ?? {}) as Record<string, string>;
      if (!isMenuOsStripeMetadata(metadata)) {
        return NextResponse.json({ received: true, skipped: "not_menuos" });
      }

      const { prisma } = await import("@menuos/db");
      if (metadata.organizationId) {
        await prisma.subscription.updateMany({
          where: { organizationId: metadata.organizationId },
          data: { status: "CANCELED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[MenuOS Stripe webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
