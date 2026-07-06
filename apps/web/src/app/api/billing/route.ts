import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireSession } from "@/lib/api-auth";
import {
  getOrganizationSubscription,
  isCheckoutPlan,
  subscribeOrganizationMock,
} from "@/lib/billing";
import { fireAdminNotify, notifyAdminStripePayment } from "@/lib/admin-notify";
import { getPlanFromCatalog } from "@/lib/plan-catalog-service";
import { isBillingMockAllowed } from "@/lib/stripe-config";
import { createPlanCheckoutSession, isStripeEnabled } from "@/lib/stripe-client";
import { safeReturnPath } from "@/lib/safe-return-path";
import type { PaidSubscriptionPlanId } from "@menuos/shared";

export async function GET() {
  const auth = await requireSession({ roles: ["ADMIN"] });
  if (auth.response) return auth.response;

  return NextResponse.json({
    stripeEnabled: isStripeEnabled(),
  });
}

export async function POST(request: Request) {
  const auth = await requireSession({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: { planId?: string; returnPath?: string; visitorSid?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const { planId, returnPath, visitorSid } = body;
  if (!planId) {
    return NextResponse.json({ error: "Απαιτείται planId." }, { status: 400 });
  }
  if (!isCheckoutPlan(planId)) {
    if (planId === "ENTERPRISE") {
      return NextResponse.json(
        { error: "Επικοινώνησε μαζί μας για τιμολόγηση Enterprise.", code: "enterprise_contact" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Μη έγκυρο πλάνο." }, { status: 400 });
  }

  const organizationId = auth.session!.organizationId;
  const user = await prisma.user.findUnique({ where: { id: auth.session!.userId } });
  if (!user) {
    return NextResponse.json({ error: "Ο χρήστης δεν βρέθηκε." }, { status: 404 });
  }

  const existingSubscription = await getOrganizationSubscription(organizationId);

  const safeReturn = safeReturnPath(returnPath);

  if (isBillingMockAllowed() && !isStripeEnabled()) {
    await subscribeOrganizationMock(organizationId, planId as PaidSubscriptionPlanId);
    const subscription = await getOrganizationSubscription(organizationId);
    const plan = await getPlanFromCatalog(planId);
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
      { error: "Το σύστημα πληρωμών δεν είναι ρυθμισμένο. Επικοινώνησε με την υποστήριξη.", code: "stripe_not_configured" },
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
      visitorSid: visitorSid?.trim() || undefined,
    });

    return NextResponse.json({
      ok: true,
      mode: "stripe",
      checkoutUrl: session.url,
      sessionId: session.sessionId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Σφάλμα χρέωσης." },
      { status: 500 },
    );
  }
}
