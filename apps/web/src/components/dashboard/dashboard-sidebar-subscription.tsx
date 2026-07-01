"use client";

import Link from "next/link";
import { DashboardStatusDot } from "@/components/dashboard/dashboard-ui";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { formatSubscriptionSummary, type SubscriptionDisplayInput } from "@/lib/subscription-display";
import type { DashboardLang } from "@/content/dashboard-i18n";

export function DashboardSidebarSubscription({
  subscription,
  lang,
}: {
  subscription: SubscriptionDisplayInput | null;
  lang: DashboardLang;
}) {
  const { d } = useDashboardCopy();
  const summary = formatSubscriptionSummary(subscription, lang);

  return (
    <Link
      href="/dashboard/billing"
      className="mt-auto block rounded-lg bg-white/5 px-3 py-2.5 transition hover:bg-white/10"
    >
      <p className="flex items-center gap-2 text-xs font-medium text-white/90">
        <DashboardStatusDot active={summary.active} />
        <span>
          {d.layout.subscriptionPrefix}: {summary.statusLine}
        </span>
      </p>
      {summary.expiryLine ? <p className="mt-1 pl-4 text-[11px] text-white/55">{summary.expiryLine}</p> : null}
    </Link>
  );
}
