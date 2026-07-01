"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

export function BillingConfirmHandler({ organizationId }: { organizationId: string }) {
  const { d } = useDashboardCopy();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const confirmStarted = useRef(false);

  useEffect(() => {
    const billing = searchParams.get("billing");
    const sessionId = searchParams.get("session_id");

    if (billing === "cancelled") {
      setMessage(d.billing.cancelled);
      setIsError(true);
      return;
    }

    if (billing === "activated") {
      setMessage(d.billing.activatedDev);
      setIsError(false);
      router.replace("/dashboard/billing");
      router.refresh();
      return;
    }

    if (billing === "confirm" && sessionId) {
      if (confirmStarted.current) return;
      confirmStarted.current = true;

      setMessage(d.billing.confirming);
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
            setMessage(data.error ?? d.billing.confirmFailed);
            setIsError(true);
            return;
          }
          if (data.subscription?.status !== "ACTIVE") {
            setMessage(d.billing.confirmFailed);
            setIsError(true);
            return;
          }
          setMessage(d.billing.activated);
          setIsError(false);
          router.replace("/dashboard/billing");
          router.refresh();
        })
        .catch(() => {
          setMessage(d.billing.confirmFailed);
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
