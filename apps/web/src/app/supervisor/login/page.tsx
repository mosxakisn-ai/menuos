import type { Metadata } from "next";
import { Suspense } from "react";
import { SupervisorLoginClient } from "./supervisor-login-client";

export const metadata: Metadata = {
  title: "MenuOS Supervisor",
  robots: { index: false, follow: false },
};

export default function SupervisorLoginPage() {
  return (
    <Suspense fallback={null}>
      <SupervisorLoginClient />
    </Suspense>
  );
}
