import Link from "next/link";
import { formatSubscriptionSummary, type SubscriptionDisplayInput } from "@/lib/subscription-display";
import { cn } from "@/lib/utils";

type Props = {
  organizationName: string;
  logoUrl: string | null;
  subscription: SubscriptionDisplayInput | null;
};

export function DashboardSidebarBrand({ organizationName, logoUrl, subscription }: Props) {
  const summary = formatSubscriptionSummary(subscription);
  const initial = organizationName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/10 object-cover"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-bold text-white"
            aria-hidden
          >
            {initial}
          </div>
        )}
        <p className="min-w-0 font-semibold leading-snug text-white">{organizationName}</p>
      </div>

      <Link
        href="/dashboard/billing"
        className="mt-3 block rounded-lg bg-white/5 px-3 py-2.5 transition hover:bg-white/10"
      >
        <p className="flex items-center gap-2 text-xs font-medium text-white/90">
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", summary.active ? "bg-emerald-400" : "bg-red-400")}
            aria-hidden
          />
          <span>Συνδρομή: {summary.statusLine}</span>
        </p>
        {summary.expiryLine ? <p className="mt-1 pl-4 text-[11px] text-white/55">{summary.expiryLine}</p> : null}
      </Link>
    </div>
  );
}
