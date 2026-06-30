import { NextResponse } from "next/server";
import type { UserRole } from "@menuos/db";
import { getSession, type SessionPayload } from "@/lib/auth";
import { getSupervisorSession } from "@/lib/supervisor-auth";
import { getOrganizationPlanContext, organizationCanUsePdfImport } from "@/lib/billing";

type AuthResult =
  | { session: SessionPayload; response: null }
  | { session: null; response: NextResponse };

export async function requireSession(options?: {
  roles?: UserRole[];
}): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Μη εξουσιοδοτημένη πρόσβαση.", code: "unauthorized" },
        { status: 401 },
      ),
    };
  }
  if (options?.roles && !options.roles.includes(session.role)) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Δεν έχεις δικαίωμα.", code: "forbidden" },
        { status: 403 },
      ),
    };
  }
  return { session, response: null };
}

export async function requireActiveSubscription(options?: {
  roles?: UserRole[];
}): Promise<AuthResult> {
  const auth = await requireSession(options);
  if (auth.response) return auth;

  const ctx = await getOrganizationPlanContext(auth.session!.organizationId);
  if (!ctx?.active) {
    return {
      session: null,
      response: NextResponse.json(
        {
          error: "Η συνδρομή σου δεν είναι ενεργή. Αναβάθμισε για να συνεχίσεις.",
          code: "subscription_inactive",
        },
        { status: 403 },
      ),
    };
  }

  return auth;
}

export async function requirePdfImportPlan(options?: {
  roles?: UserRole[];
}): Promise<AuthResult> {
  const auth = await requireActiveSubscription(options);
  if (auth.response) return auth;

  const ctx = await getOrganizationPlanContext(auth.session!.organizationId);
  if (!ctx || !organizationCanUsePdfImport(ctx.planId)) {
    return {
      session: null,
      response: NextResponse.json(
        {
          error: "Το PDF import είναι διαθέσιμο στο πλάνο Pro. Αναβάθμισε για να συνεχίσεις.",
          code: "plan_upgrade_required",
        },
        { status: 403 },
      ),
    };
  }

  return auth;
}

type SupervisorAuthResult =
  | { supervisor: { username: string }; response: null }
  | { supervisor: null; response: NextResponse };

export async function requireSupervisor(): Promise<SupervisorAuthResult> {
  const supervisor = await getSupervisorSession();
  if (!supervisor) {
    return {
      supervisor: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { supervisor, response: null };
}
