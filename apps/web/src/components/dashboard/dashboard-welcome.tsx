"use client";

import { FlashMessages } from "@/components/dashboard/flash-message";
import { DASHBOARD_EL } from "@/content/dashboard-el";

export function DashboardWelcome({ show }: { show?: boolean }) {
  if (!show) return null;

  return (
    <FlashMessages
      initial={{
        type: "info",
        text: DASHBOARD_EL.welcome,
      }}
    />
  );
}
