import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { addSupervisorOperator, findSupervisorOperatorByUsername, listSupervisorOperators } from "@/lib/supervisor-operator-service";
import { supervisorAddOperatorSchema } from "@/lib/supervisor-schemas";

export async function GET() {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  try {
    const current = auth.supervisor!.username.trim().toLowerCase();
    const operators = (await listSupervisorOperators()).filter((op) => op.username !== current);
    const self = await findSupervisorOperatorByUsername(current);
    return NextResponse.json({
      operators,
      currentUsername: current,
      canChangeOwnPassword: Boolean(self?.active),
    });
  } catch (err) {
    console.error("[menuos-supervisor] list operators", err);
    return NextResponse.json({ error: "Αποτυχία φόρτωσης." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = supervisorAddOperatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Έλεγξε username (a-z, 0-9, . _ -) και password (min 8)." },
      { status: 400 },
    );
  }

  try {
    const operator = await addSupervisorOperator(parsed.data);
    return NextResponse.json({ operator, message: "Προστέθηκε μέλος ομάδας." });
  } catch (err) {
    if (err instanceof Error && err.message === "username_taken") {
      return NextResponse.json({ error: "Το username χρησιμοποιείται ήδη." }, { status: 409 });
    }
    if (err instanceof Error && err.message === "username_reserved") {
      return NextResponse.json(
        { error: "Αυτό το username είναι δεσμευμένο για τον λογαριασμό .env." },
        { status: 409 },
      );
    }
    console.error("[menuos-supervisor] add operator", err);
    return NextResponse.json({ error: "Αποτυχία προσθήκης." }, { status: 500 });
  }
}
