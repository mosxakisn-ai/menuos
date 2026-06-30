import { NextResponse } from "next/server";
import type { UserRole } from "@menuos/db";
import { getSession, type SessionPayload } from "@/lib/auth";
import { getOrganizationPlanContext } from "@/lib/billing";

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
