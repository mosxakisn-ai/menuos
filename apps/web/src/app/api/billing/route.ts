import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireSession } from "@/lib/api-auth";
import {
  getOrganizationSubscription,
  isCheckoutPlan,
  subscribeOrganizationMock,
} from "@/lib/billing";
import { fireAdminNotify, notifyAdminStripePayment } from "@/lib/admin-notify";
import { getPlan } from "@menuos/shared";
import { isBillingMockAllowed } from "@/lib/stripe-config";
import { createPlanCheckoutSession, isStripeEnabled } from "@/lib/stripe-client";
import type { PaidSubscriptionPlanId } from "@menuos/shared";

export async function GET() {
  return NextResponse.json({
    stripeEnabled: isStripeEnabled(),
    app: "menuos",
    platform: "menuos.gr",
    webhookPath: "/api/billing/webhook",
    stripeFilter: "metadata.app = menuos",
  });
}

export async function POST(request: Request) {
  const auth = await requireSession({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: { planId?: string; returnPath?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { planId, returnPath } = body;
  if (!planId) {
    return NextResponse.json({ error: "planId required" }, { status: 400 });
  }
  if (!isCheckoutPlan(planId)) {
    if (planId === "ENTERPRISE") {
      return NextResponse.json(
        { error: "Contact us for Enterprise pricing", code: "enterprise_contact" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const organizationId = auth.session!.organizationId;
  const user = await prisma.user.findUnique({ where: { id: auth.session!.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingSubscription = await getOrganizationSubscription(organizationId);

  const safeReturn =
    typeof returnPath === "string" && returnPath.startsWith("/") ? returnPath : "/dashboard/billing";

  if (isBillingMockAllowed() && !isStripeEnabled()) {
    await subscribeOrganizationMock(organizationId, planId as PaidSubscriptionPlanId);
    const subscription = await getOrganizationSubscription(organizationId);
    const plan = getPlan(planId);
    fireAdminNotify(() =>
      notifyAdminStripePayment({
        paymentType: "subscription",
        amountEur: plan.priceMonthly,
        organizationId,
        customerEmail: user.email,
        planId,
      }),
    );
    return NextResponse.json({
      ok: true,
      mode: "mock",
      checkoutUrl: `${safeReturn}?billing=activated&plan=${planId}`,
      subscription,
    });
  }

  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: "Payment system not configured. Contact support.", code: "stripe_not_configured" },
      { status: 503 },
    );
  }

  try {
    const session = await createPlanCheckoutSession({
      organizationId,
      planId: planId as PaidSubscriptionPlanId,
      customerEmail: user.email,
      stripeCustomerId: existingSubscription?.stripeCustomerId,
      returnPath: safeReturn,
    });

    return NextResponse.json({
      ok: true,
      mode: "stripe",
      checkoutUrl: session.url,
      sessionId: session.sessionId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Billing error" },
      { status: 500 },
    );
  }
}
