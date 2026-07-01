import { Suspense } from "react";
import { StationPassScreen } from "@/components/dashboard/station-pass-screen";

export const metadata = {
  title: "Μπαρ — MenuOS",
  robots: { index: false, follow: false },
};

export default function BdsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <StationPassScreen station="bar" />
    </Suspense>
  );
}
