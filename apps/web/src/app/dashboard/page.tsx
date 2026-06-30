import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@menuos/db";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Dashboard", "/dashboard");

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const org = await prisma.organization.findUnique({
    where: { id: session!.organizationId },
    include: {
      venues: {
        include: {
          menus: {
            include: {
              categories: { include: { items: true } },
            },
          },
        },
      },
      subscription: true,
    },
  });

  const venues = org?.venues ?? [];
  const venueCount = venues.length;
  const menuCount = venues.reduce((n, v) => n + v.menus.length, 0);
  const itemCount = venues.reduce(
    (n, v) => n + v.menus.reduce((m, menu) => m + menu.categories.reduce((c, cat) => c + cat.items.length, 0), 0),
    0,
  );
  const firstVenue = venues[0];
  const hasCategory = venues.some((v) => v.menus.some((m) => m.categories.length > 0));

  return (
    <div className="space-y-6">
      <DashboardWelcome show={sp.welcome === "1"} />
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">{org?.name}</h1>
        <p className="text-sm text-slate-600">
          Πλάνο: {org?.subscription?.plan ?? "TRIAL"} · {venueCount} venue · {menuCount} menu · {itemCount} πιάτα
        </p>
      </div>

      <OnboardingWizard
        state={{
          hasVenue: venueCount > 0,
          hasCategory,
          hasItem: itemCount > 0,
          venueId: firstVenue?.id,
          venueSlug: firstVenue?.slug,
          itemCount,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Μαγαζιά" value={venueCount} hint={venueCount === 0 ? "Πρόσθεσε το πρώτο" : undefined} />
        <StatCard label="Πιάτα" value={itemCount} hint={itemCount === 0 ? "Πρόσθεσε στον κατάλογο" : undefined} />
        <StatCard label="Δοκιμή έως" value={formatTrial(org?.subscription?.trialEndsAt)} />
      </div>

      <Card>
        <h2 className="font-semibold text-primary">Γρήγορες ενέργειες</h2>
        <p className="mt-2 text-sm text-slate-600">
          {itemCount === 0
            ? "Ξεκίνα προσθέτοντας κατηγορίες και πιάτα — μετά βγάλε QR για τα τραπέζια σου."
            : "Το menu σου είναι live! Βγάλε QR ή δες κλήσεις σερβιτόρου."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {venueCount === 0 ? (
            <Link href="/dashboard/venues/new" className={buttonClass("primary")}>
              + Προσθήκη venue
            </Link>
          ) : (
            <>
              <Link
                href={`/dashboard/menus${firstVenue ? `?venue=${firstVenue.id}` : ""}`}
                className={buttonClass("primary")}
              >
                Επεξεργασία menu
              </Link>
              <Link
                href={`/dashboard/qr${firstVenue ? `?venue=${firstVenue.id}` : ""}`}
                className={buttonClass("secondary")}
              >
                QR codes
              </Link>
              {firstVenue ? (
                <a
                  href={`/m/${firstVenue.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary")}
                >
                Live προεπισκόπηση
                </a>
              ) : null}
            </>
          )}
          <Link href="/dashboard/billing" className={buttonClass("secondary")}>
            Συνδρομή
          </Link>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-brand-blue">{hint}</p> : null}
    </Card>
  );
}

function formatTrial(date?: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("el-GR");
}
