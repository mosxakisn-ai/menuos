import { NextResponse } from "next/server";
import { organizationNotificationSettingsSchema } from "@menuos/shared";
import { getSession } from "@/lib/auth";
import { canManageVenueSecrets } from "@/lib/dashboard-roles";
import {
  getOrganizationNotificationSettings,
  saveOrganizationNotificationSettings,
} from "@/lib/organization-notification-settings";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageVenueSecrets(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getOrganizationNotificationSettings(session.organizationId);
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageVenueSecrets(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = organizationNotificationSettingsSchema.partial().safeParse(body?.settings ?? body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  const settings = await saveOrganizationNotificationSettings(session.organizationId, parsed.data);
  return NextResponse.json({ settings });
}
