import { NextResponse } from "next/server";
import { zodFirstErrorMessage } from "@menuos/shared";
import { requireSupervisor } from "@/lib/api-auth";
import { supervisorOrganizationUpdateSchema } from "@/lib/supervisor-schemas";
import {
  getOrganizationForSupervisor,
  updateOrganizationForSupervisor,
} from "@/lib/supervisor-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const { id } = await params;
  const organization = await getOrganizationForSupervisor(id);
  if (!organization) {
    return NextResponse.json({ error: "Δεν βρέθηκε." }, { status: 404 });
  }
  return NextResponse.json({ organization });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = supervisorOrganizationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const organization = await updateOrganizationForSupervisor(id, parsed.data);
    const message =
      parsed.data.plan !== undefined ||
      parsed.data.status !== undefined ||
      parsed.data.extendTrialDays !== undefined ||
      parsed.data.grantProMonths !== undefined
        ? "Αποθήκευση συνδρομής."
        : "Αποθήκευση στοιχείων.";
    return NextResponse.json({ organization, message });
  } catch (err) {
    if (err instanceof Error && err.message === "not_found") {
      return NextResponse.json({ error: "Δεν βρέθηκε." }, { status: 404 });
    }
    if (err instanceof Error && err.message === "email_taken") {
      return NextResponse.json({ error: "Το email χρησιμοποιείται ήδη." }, { status: 409 });
    }
    if (err instanceof Error && err.message === "no_user") {
      return NextResponse.json({ error: "Δεν βρέθηκε χρήστης για ενημέρωση email." }, { status: 400 });
    }
    if (err instanceof Error && err.message === "extend_trial_not_allowed") {
      return NextResponse.json(
        { error: "Δεν μπορείς να επεκτείνεις trial σε πληρωμένο πακέτο." },
        { status: 400 },
      );
    }
    console.error("[menuos-supervisor] organization update", err);
    return NextResponse.json({ error: "Αποτυχία ενημέρωσης." }, { status: 500 });
  }
}
