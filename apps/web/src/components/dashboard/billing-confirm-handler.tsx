"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DASHBOARD_EL } from "@/content/dashboard-el";

export function BillingConfirmHandler({ organizationId }: { organizationId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const confirmStarted = useRef(false);

  useEffect(() => {
    const billing = searchParams.get("billing");
    const sessionId = searchParams.get("session_id");

    if (billing === "cancelled") {
      setMessage(DASHBOARD_EL.billing.cancelled);
      setIsError(true);
      return;
    }

    if (billing === "activated") {
      setMessage(DASHBOARD_EL.billing.activatedDev);
      setIsError(false);
      router.replace("/dashboard/billing");
      router.refresh();
      return;
    }

    if (billing === "confirm" && sessionId) {
      if (confirmStarted.current) return;
      confirmStarted.current = true;

      setMessage(DASHBOARD_EL.billing.confirming);
      setIsError(false);
      fetch("/api/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, organizationId }),
      })
        .then(async (res) => {
          const data = (await res.json()) as {
            error?: string;
            subscription?: { status?: string; plan?: string };
          };
          if (!res.ok) {
            setMessage(data.error ?? DASHBOARD_EL.billing.confirmFailed);
            setIsError(true);
            return;
          }
          if (data.subscription?.status !== "ACTIVE") {
            setMessage(DASHBOARD_EL.billing.confirmFailed);
            setIsError(true);
            return;
          }
          setMessage(DASHBOARD_EL.billing.activated);
          setIsError(false);
          router.replace("/dashboard/billing");
          router.refresh();
        })
        .catch(() => {
          setMessage(DASHBOARD_EL.billing.confirmFailed);
          setIsError(true);
        });
    }
  }, [organizationId, router, searchParams]);

  if (!message) return null;

  return (
    <div
      className={`rounded-button border px-4 py-3 text-sm ${
        isError
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {message}
    </div>
  );
}
