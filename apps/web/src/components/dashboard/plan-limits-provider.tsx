"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DashboardPlanLimitsSnapshot } from "@/lib/dashboard-plan-limits";

const PlanLimitsContext = createContext<DashboardPlanLimitsSnapshot | null>(null);

export function PlanLimitsProvider({
  value,
  children,
}: {
  value: DashboardPlanLimitsSnapshot | null;
  children: ReactNode;
}) {
  return <PlanLimitsContext.Provider value={value}>{children}</PlanLimitsContext.Provider>;
}

export function usePlanLimits(): DashboardPlanLimitsSnapshot | null {
  return useContext(PlanLimitsContext);
}
