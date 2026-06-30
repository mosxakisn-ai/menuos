import type { Metadata } from "next";
import { SupervisorShell } from "@/components/supervisor/supervisor-shell";

export const metadata: Metadata = {
  title: "MenuOS Supervisor",
  robots: { index: false, follow: false },
};

export default function SupervisorPanelLayout({ children }: { children: React.ReactNode }) {
  return <SupervisorShell>{children}</SupervisorShell>;
}
