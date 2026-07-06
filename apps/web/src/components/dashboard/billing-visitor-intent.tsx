"use client";

import { useEffect } from "react";
import { bumpVisitorIntentStep } from "@/lib/visitor-intent-client";

/** Attach logged-in email to checkout funnel tracking on billing page. */
export function BillingVisitorIntentLabel({ email }: { email: string }) {
  const label = email.trim();
  useEffect(() => {
    if (!label) return;
    bumpVisitorIntentStep({
      surface: "checkout",
      step: "checkout_opened",
      path: "/dashboard/billing",
      visitorLabel: label,
    });
  }, [label]);
  return null;
}
