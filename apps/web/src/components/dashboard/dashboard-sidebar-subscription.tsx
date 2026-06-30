import Link from "next/link";
import { formatSubscriptionSummary, type SubscriptionDisplayInput } from "@/lib/subscription-display";
import { cn } from "@/lib/utils";

export function DashboardSidebarSubscription({
  subscription,
}: {
  subscription: SubscriptionDisplayInput | null;
}) {
  const summary = formatSubscriptionSummary(subscription);

  return (
    <Link
      href="/dashboard/billing"
      className="mt-auto block rounded-lg bg-white/5 px-3 py-2.5 transition hover:bg-white/10"
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
  );
}
