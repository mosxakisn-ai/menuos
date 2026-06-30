import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SupervisorShell } from "@/components/supervisor/supervisor-shell";
import { getSupervisorSession } from "@/lib/supervisor-auth";

export const metadata: Metadata = {
  title: "MenuOS Supervisor",
  robots: { index: false, follow: false },
};

export default async function SupervisorPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSupervisorSession();
  if (!session) {
    redirect("/supervisor/login");
  }

  return <SupervisorShell>{children}</SupervisorShell>;
}
