import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PushNotificationsPrompt } from "@/components/dashboard/push-notifications-prompt";
import { StaffWaiterInvalidLink } from "@/components/dashboard/staff-waiter-invalid-link";
import { WaiterPanel } from "@/components/dashboard/waiter-panel";
import { getOrganizationPlanContext, organizationCanUseLive360 } from "@/lib/billing";
import { resolveStaffAuthByKey, resolveStaffAuthBySlug } from "@/lib/staff-auth";
import { clearStaffSessionCookie, readStaffSessionFromCookies } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Σερβιτόρος — MenuOS",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ key?: string; zone?: string }>;
};

export default async function StaffWaiterPage({ params, searchParams }: Props) {
  const { venueSlug } = await params;
  const { key, zone } = await searchParams;
  const incomingKey = key?.trim();
  const initialZoneId = zone?.trim() || undefined;

  if (incomingKey) {
    const auth = await resolveStaffAuthBySlug(venueSlug, incomingKey);
    if (!auth) return <StaffWaiterInvalidLink venueSlug={venueSlug} invalidKey />;
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

  return (
    <div className="min-h-screen bg-brand-surface/40">
      <header className="border-b border-slate-200/80 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue/70">MenuOS</p>
        <h1 className="font-serif text-xl font-bold text-primary">Κλήσεις σερβιτόρου</h1>
        <p className="mt-1 text-sm text-slate-600">
          {venue.name}
          {staffMember ? (
            <>
              {" "}
              · <span className="font-medium text-brand-navy">{staffMember.name}</span>
            </>
          ) : null}
        </p>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <PushNotificationsPrompt staffAuth={{ venueId: venue.id }} />
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
        />
      </main>
    </div>
  );
}
