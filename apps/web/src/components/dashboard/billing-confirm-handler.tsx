"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function BillingConfirmHandler({ organizationId }: { organizationId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const confirmStarted = useRef(false);

  useEffect(() => {
    const billing = searchParams.get("billing");
    const sessionId = searchParams.get("session_id");

    if (billing === "cancelled") {
      setMessage("Checkout cancelled. No charges were made.");
      return;
    }

    if (billing === "activated") {
      setMessage("Plan activated (dev mode).");
      router.replace("/dashboard/billing");
      router.refresh();
      return;
    }

    if (billing === "confirm" && sessionId) {
      if (confirmStarted.current) return;
      confirmStarted.current = true;

      setMessage("Confirming payment…");
      fetch("/api/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, organizationId }),
      })
        .then(async (res) => {
          const data = (await res.json()) as { error?: string };
          if (!res.ok) {
            setMessage(data.error ?? "Payment confirmation failed");
            return;
          }
          setMessage("Subscription activated. Thank you!");
          router.replace("/dashboard/billing");
          router.refresh();
        })
        .catch(() => setMessage("Payment confirmation failed"));
    }
  }, [organizationId, router, searchParams]);

  if (!message) return null;

  return (
    <div
      className={`rounded-button border px-4 py-3 text-sm ${
        message.includes("failed") || message.includes("cancelled")
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {message}
    </div>
  );
}
