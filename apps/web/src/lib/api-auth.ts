import { NextResponse } from "next/server";
import type { UserRole } from "@menuos/db";
import { getSession, type SessionPayload } from "@/lib/auth";

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
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (options?.roles && !options.roles.includes(session.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, response: null };
}
