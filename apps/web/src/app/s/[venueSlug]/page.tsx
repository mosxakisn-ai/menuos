import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listVenuePosts } from "@menuos/shared";
import { Logo } from "@/components/brand/logo";
import { StaffWaiterInvalidLink } from "@/components/dashboard/staff-waiter-invalid-link";
import { StaffWaiterSetupBar } from "@/components/dashboard/staff-waiter-setup-bar";
import { WaiterShiftLockControl } from "@/components/dashboard/waiter-shift-lock";
import { WaiterPanel } from "@/components/dashboard/waiter-panel";
import { getOrganizationPlanContext, organizationCanUseLive360 } from "@/lib/billing";
import { resolveStaffAuthByKey, resolveStaffAuthBySlug, type StaffMemberContext } from "@/lib/staff-auth";
import { clearStaffSessionCookie, readStaffSessionFromCookies } from "@/lib/staff-session";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { getOrganizationNotificationSettings } from "@/lib/organization-notification-settings";
import {
  resolvePassStaffAccessResult,
  type StaffPassStaffAccessResult,
} from "@/lib/staff-member-access-url";

export const metadata: Metadata = {
  title: "Σερβιτόρος — MenuOS",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ key?: string; zone?: string }>;
};

async function resolvePassStaffAccess(
  venueId: string,
  venueSlug: string,
  staffMember: StaffMemberContext | null,
): Promise<StaffPassStaffAccessResult> {
  if (!staffMember) return { kind: "waiter" };
  const opsConfig = await getVenueOperationsConfig(venueId);
  const posts = listVenuePosts(opsConfig);
  return resolvePassStaffAccessResult({
    venueId,
    venueSlug,
    stations: staffMember.stations,
    posts,
  });
}

function passStaffInvalidLink(venueSlug: string, access: StaffPassStaffAccessResult) {
  if (access.kind === "missing-screen") {
    return <StaffWaiterInvalidLink venueSlug={venueSlug} missingTabletScreen />;
  }
  if (access.kind === "invalid-assignment") {
    return <StaffWaiterInvalidLink venueSlug={venueSlug} invalidAssignment />;
  }
  return null;
}

export default async function StaffWaiterPage({ params, searchParams }: Props) {
  const { venueSlug } = await params;
  const { key, zone } = await searchParams;
  const incomingKey = key?.trim();
  const initialZoneId = zone?.trim() || undefined;

  if (incomingKey) {
    const auth = await resolveStaffAuthBySlug(venueSlug, incomingKey);
    if (!auth) return <StaffWaiterInvalidLink venueSlug={venueSlug} invalidKey />;
    const passAccess = await resolvePassStaffAccess(auth.venue.id, venueSlug, auth.staffMember);
    if (passAccess.kind === "tablet") redirect(passAccess.url);
    const invalid = passStaffInvalidLink(venueSlug, passAccess);
    if (invalid) return invalid;
    const sessionParams = new URLSearchParams({ venueSlug, key: incomingKey });
    if (initialZoneId) sessionParams.set("zone", initialZoneId);
    redirect(`/api/staff/session?${sessionParams.toString()}`);
  }

  const session = await readStaffSessionFromCookies();
  if (!session) {
    return <StaffWaiterInvalidLink venueSlug={venueSlug} />;
  }

  const auth = await resolveStaffAuthByKey(session.venueId, session.staffToken);
  if (!auth || auth.venue.slug !== venueSlug) {
    await clearStaffSessionCookie();
    return <StaffWaiterInvalidLink venueSlug={venueSlug} />;
  }

  const plan = await getOrganizationPlanContext(auth.venue.organizationId);
  if (!plan?.active) {
    await clearStaffSessionCookie();
    return <StaffWaiterInvalidLink venueSlug={venueSlug} subscriptionInactive />;
  }
  if (!organizationCanUseLive360(plan.planId)) {
    return <StaffWaiterInvalidLink venueSlug={venueSlug} proRequired />;
  }

  const { venue, staffMember } = auth;
  const staffZoneLock = staffMember?.zoneId?.trim() || initialZoneId?.trim();

  const passAccess = await resolvePassStaffAccess(venue.id, venue.slug, staffMember);
  if (passAccess.kind === "tablet") redirect(passAccess.url);
  const invalid = passStaffInvalidLink(venue.slug, passAccess);
  if (invalid) return invalid;

  const notificationSettings = await getOrganizationNotificationSettings(venue.organizationId);

  return (
    <div className="min-h-screen bg-brand-surface/40">
      <header className="border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <Logo href={false} markSize={28} className="gap-2" wordmarkClassName="text-base leading-none" />
          <div className="min-w-0 text-right">
            <h1 className="truncate text-base font-bold text-primary sm:text-lg">Κλήσεις σερβιτόρου</h1>
            <p className="truncate text-xs text-slate-600">
              {venue.name}
              {staffMember && !staffZoneLock ? (
                <>
                  {" "}
                  · <span className="font-medium text-brand-navy">{staffMember.name}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-2 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4">
        <StaffWaiterSetupBar
          staffAuth={{ venueId: venue.id }}
          voiceEnabled={notificationSettings.voiceMessagesEnabled}
        />
        <WaiterShiftLockControl compact />
        <WaiterPanel
          venues={[{ id: venue.id, name: venue.name, slug: venue.slug }]}
          initialVenueId={venue.id}
          initialZoneId={staffMember?.zoneId ?? initialZoneId}
          staffViaCookie
          staffMember={
            staffMember
              ? { name: staffMember.name, stations: staffMember.stations }
              : null
          }
          notificationSettings={notificationSettings}
        />
      </main>
    </div>
  );
}
