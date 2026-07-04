"use client";

import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { ProFeatureLockedPanel } from "@/components/dashboard/pro-feature-locked-panel";

export function Live360FeatureGate({
  enabled,
  staffMode,
  children,
}: {
  enabled: boolean;
  staffMode?: boolean;
  children: React.ReactNode;
}) {
  const { d } = useDashboardCopy();
  const copy = d.proFeature.live360;

  if (enabled) return <>{children}</>;

  return (
    <ProFeatureLockedPanel
      title={copy.title}
      description={staffMode ? copy.staffDescription : copy.description}
      upgradeLabel={copy.upgrade}
      backLabel={copy.back}
      backHref={staffMode ? "/dashboard/waiter" : "/dashboard"}
      staffMode={staffMode}
    />
  );
}
