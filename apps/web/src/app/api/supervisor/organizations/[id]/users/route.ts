import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { supervisorAddUserSchema } from "@/lib/supervisor-schemas";
import { addUserForSupervisor, listUsersForSupervisor } from "@/lib/supervisor-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    const users = await listUsersForSupervisor(id);
    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof Error && err.message === "not_found") {
      return NextResponse.json({ error: "Δεν βρέθηκε." }, { status: 404 });
    }
    console.error("[menuos-supervisor] list users", err);
    return NextResponse.json({ error: "Αποτυχία φόρτωσης." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = supervisorAddUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Έλεγξε τα πεδία (email, password min 8)." }, { status: 400 });
  }

  try {
    const user = await addUserForSupervisor(id, parsed.data);
    return NextResponse.json({ user, message: "Προστέθηκε ο χρήστης." });
  } catch (err) {
    if (err instanceof Error && err.message === "not_found") {
      return NextResponse.json({ error: "Δεν βρέθηκε." }, { status: 404 });
    }
    if (err instanceof Error && err.message === "email_taken") {
      return NextResponse.json({ error: "Το email χρησιμοποιείται ήδη." }, { status: 409 });
    }
    console.error("[menuos-supervisor] add user", err);
    return NextResponse.json({ error: "Αποτυχία προσθήκης." }, { status: 500 });
  }
}
