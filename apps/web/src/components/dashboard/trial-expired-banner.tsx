"use client";

import { useSearchParams } from "next/navigation";

export function TrialExpiredBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("trial") !== "expired") return null;

  return (
    <div className="rounded-button border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Η δωρεάν δοκιμή σας έληξε. Διάλεξε πλάνο για να συνεχίσουν οι πελάτες σου να βλέπουν το menu.
    </div>
  );
}
