"use client";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { DashboardLanguageSwitcher } from "@/components/dashboard/dashboard-language-switcher";
import { DashboardStatusDot } from "@/components/dashboard/dashboard-ui";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { panelPhotoDisplayUrl } from "@/lib/photo-display-url";

type DashboardHeaderProps = {
  businessName: string;
  businessLogoUrl: string | null;
  role: string;
  subscriptionExpiryLine: string | null;
  subscriptionActive: boolean;
};

export function DashboardHeader({
  businessName,
  businessLogoUrl,
  role,
  subscriptionExpiryLine,
  subscriptionActive,
}: DashboardHeaderProps) {
  const { d, roleLabel } = useDashboardCopy();

  return (
    <header className="flex min-h-[4.5rem] items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 py-3">
        {businessLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={panelPhotoDisplayUrl(businessLogoUrl) ?? businessLogoUrl}
            alt=""
            className="hidden h-11 w-11 shrink-0 rounded-xl border border-slate-200/80 bg-slate-50 object-cover sm:block"
          />
        ) : null}
        <div className="flex min-w-0 flex-col justify-center gap-0.5">
          <p className="text-[11px] font-medium uppercase tracking-wide leading-none text-slate-400">
            {d.layout.welcome}
          </p>
          <p className="truncate text-lg font-semibold leading-tight text-primary">{businessName}</p>
          {subscriptionExpiryLine ? (
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-400 md:hidden">
              <DashboardStatusDot active={subscriptionActive} size="sm" />
              {subscriptionExpiryLine}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <DashboardLanguageSwitcher className="hidden sm:flex" />
        <span className="hidden rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue sm:inline-flex">
          {roleLabel(role)}
        </span>
        <LogoutButton variant="header" />
      </div>
    </header>
  );
}
