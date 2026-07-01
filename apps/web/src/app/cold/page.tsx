import { Suspense } from "react";
import { StationPassScreen } from "@/components/dashboard/station-pass-screen";

export const metadata = {
  title: "Κρύα κουζίνα — MenuOS",
  robots: { index: false, follow: false },
};

export default function ColdScreenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <StationPassScreen station="cold" />
    </Suspense>
  );
}
