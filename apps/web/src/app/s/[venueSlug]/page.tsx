import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PushNotificationsPrompt } from "@/components/dashboard/push-notifications-prompt";
import { WaiterPanel } from "@/components/dashboard/waiter-panel";
import { resolveVenueByStaffKey, resolveVenueByStaffSlug } from "@/lib/staff-auth";
import {
  clearStaffSessionCookie,
  readStaffSessionFromCookies,
  setStaffSessionCookie,
} from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Σερβιτόρος — MenuOS",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ key?: string }>;
};

export default async function StaffWaiterPage({ params, searchParams }: Props) {
  const { venueSlug } = await params;
  const { key } = await searchParams;
  const incomingKey = key?.trim();

  if (incomingKey) {
    const venue = await resolveVenueByStaffSlug(venueSlug, incomingKey);
    if (!venue) notFound();
    await setStaffSessionCookie(venue.id, incomingKey);
    redirect(`/s/${venueSlug}`);
  }

  const session = await readStaffSessionFromCookies();
  if (!session) notFound();

  const venue = await resolveVenueByStaffKey(session.venueId, session.staffToken);
  if (!venue || venue.slug !== venueSlug) {
    await clearStaffSessionCookie();
    notFound();
  }

  return (
    <div className="min-h-screen bg-brand-surface/40">
      <header className="border-b border-slate-200/80 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue/70">MenuOS</p>
        <h1 className="font-serif text-xl font-bold text-primary">Κλήσεις σερβιτόρου</h1>
        <p className="mt-1 text-sm text-slate-600">{venue.name}</p>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <PushNotificationsPrompt staffAuth={{ venueId: venue.id }} />
        <WaiterPanel
          venues={[{ id: venue.id, name: venue.name, slug: venue.slug }]}
          initialVenueId={venue.id}
          staffViaCookie
          showShareLink={false}
        />
      </main>
    </div>
  );
}
