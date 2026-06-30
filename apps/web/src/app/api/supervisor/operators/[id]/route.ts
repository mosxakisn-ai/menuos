import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import {
  findSupervisorOperatorByUsername,
  updateSupervisorOperator,
} from "@/lib/supervisor-operator-service";
import { supervisorUpdateOperatorSchema } from "@/lib/supervisor-schemas";

type Params = { params: Promise<{ id: string }> };

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

  const parsed = supervisorUpdateOperatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Έλεγξε τα πεδία." }, { status: 400 });
  }

  try {
    if (parsed.data.active === false) {
      const target = await findSupervisorOperatorByUsername(auth.supervisor!.username);
      if (target?.id === id) {
        return NextResponse.json(
          { error: "Δεν μπορείς να απενεργοποιήσεις τον εαυτό σου." },
          { status: 400 },
        );
      }
    }

    const operator = await updateSupervisorOperator(id, parsed.data);
    return NextResponse.json({ operator, message: "Ενημερώθηκε." });
  } catch (err) {
    if (err instanceof Error && err.message === "not_found") {
      return NextResponse.json({ error: "Δεν βρέθηκε." }, { status: 404 });
    }
    console.error("[menuos-supervisor] update operator", err);
    return NextResponse.json({ error: "Αποτυχία ενημέρωσης." }, { status: 500 });
  }
}
