import {
  activateSubscriptionFromCheckoutSession,
  isMenuOsStripeMetadata,
  isStripeEnabled,
  stripeGetSubscription,
  verifyStripeWebhookSignature,
} from "@/lib/stripe-client";
import {
  isCheckoutPlan,
  mapStripeSubscriptionStatus,
  planIdFromStripeSubscription,
  syncSubscriptionFromStripe,
} from "@/lib/billing";
import { fireAdminNotify, notifyAdminStripePayment } from "@/lib/admin-notify";
import { prisma } from "@menuos/db";
import { NextRequest, NextResponse } from "next/server";

function sessionAmountEur(session: Record<string, unknown>): number {
  const total = session.amount_total;
  if (typeof total === "number") return Math.round(total) / 100;
  return 0;
}

function stripePeriodEnd(obj: Record<string, unknown>): Date | undefined {
  const ts = obj.current_period_end ?? obj.period_end;
  if (typeof ts === "number") return new Date(ts * 1000);
  return undefined;
}

function stripeSubscriptionId(obj: Record<string, unknown>): string | null {
  if (typeof obj.subscription === "string") return obj.subscription;
  if (typeof obj.id === "string" && obj.object === "subscription") return obj.id;
  return null;
}

async function resolveSubscriptionPeriodEnd(stripeSubId: string): Promise<Date> {
  const sub = await stripeGetSubscription(stripeSubId);
  if (typeof sub.current_period_end !== "number") {
    throw new Error(`Stripe subscription ${stripeSubId} missing current_period_end`);
  }
  return new Date(sub.current_period_end * 1000);
}

async function claimWebhookEvent(eventId: string): Promise<"claimed" | "duplicate"> {
  try {
    await prisma.stripeWebhookEvent.create({ data: { id: eventId } });
    return "claimed";
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code: string }).code : null;
    if (code === "P2002") return "duplicate";
    throw err;
  }
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

  let event: { id?: string; type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.id) {
    const claim = await claimWebhookEvent(event.id);
    if (claim === "duplicate") {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = (session.metadata ?? {}) as Record<string, string>;

      if (isMenuOsStripeMetadata(metadata)) {
        const mode = session.mode as string;
        const paymentStatus = session.payment_status as string;

        if (
          mode === "subscription" &&
          metadata.organizationId &&
          metadata.planId &&
          isCheckoutPlan(metadata.planId) &&
          (paymentStatus === "paid" || paymentStatus === "no_payment_required")
        ) {
          const stripeSubId =
            typeof session.subscription === "string" ? session.subscription : null;
          if (!stripeSubId) {
            throw new Error("checkout.session.completed missing subscription id");
          }

          const currentPeriodEnd = await resolveSubscriptionPeriodEnd(stripeSubId);

          await activateSubscriptionFromCheckoutSession({
            organizationId: metadata.organizationId,
            planId: metadata.planId,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSubId,
            currentPeriodEnd,
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
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const metadata = (subscription.metadata ?? {}) as Record<string, string>;
      const stripeSubId = typeof subscription.id === "string" ? subscription.id : null;
      const resolvedPlanId =
        metadata.planId && isCheckoutPlan(metadata.planId)
          ? metadata.planId
          : planIdFromStripeSubscription(subscription);

      if (isMenuOsStripeMetadata(metadata) || stripeSubId) {
        await syncSubscriptionFromStripe({
          organizationId: metadata.organizationId,
          stripeSubId,
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
          status: mapStripeSubscriptionStatus(String(subscription.status ?? "canceled")),
          currentPeriodEnd: stripePeriodEnd(subscription),
          planId: resolvedPlanId,
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const metadata = (subscription.metadata ?? {}) as Record<string, string>;
      const stripeSubId = typeof subscription.id === "string" ? subscription.id : null;

      let shouldSync = true;
      if (!isMenuOsStripeMetadata(metadata)) {
        if (!stripeSubId) {
          shouldSync = false;
        } else {
          const row = await prisma.subscription.findFirst({ where: { stripeSubId } });
          if (!row) shouldSync = false;
        }
      }

      if (shouldSync) {
        await syncSubscriptionFromStripe({
          organizationId: metadata.organizationId,
          stripeSubId,
          status: "CANCELED",
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subId = stripeSubscriptionId(invoice);
      if (subId) {
        const local = await prisma.subscription.findFirst({ where: { stripeSubId: subId } });
        if (local?.status !== "CANCELED") {
          await syncSubscriptionFromStripe({
            stripeSubId: subId,
            status: "PAST_DUE",
          });
        }
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const subId = stripeSubscriptionId(invoice);
      if (subId) {
        const local = await prisma.subscription.findFirst({ where: { stripeSubId: subId } });
        if (local?.status !== "CANCELED") {
          const stripeSub = await stripeGetSubscription(subId);
          const stripeStatus = String(stripeSub.status ?? "canceled");
          if (stripeStatus === "active" || stripeStatus === "trialing") {
            await syncSubscriptionFromStripe({
              stripeSubId: subId,
              status: mapStripeSubscriptionStatus(stripeStatus),
              currentPeriodEnd: stripePeriodEnd(stripeSub as Record<string, unknown>),
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    if (event.id) {
      await prisma.stripeWebhookEvent.delete({ where: { id: event.id } }).catch(() => undefined);
    }
    console.error("[MenuOS Stripe webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
