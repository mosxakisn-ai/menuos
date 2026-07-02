"use client";

import { Check, Copy, Link2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { dashboardTextActionClass } from "@/components/dashboard/dashboard-action-button";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { confirmWarning } from "@/lib/confirm-action";
import { clientShareOrigin } from "@/lib/client-share-origin";

export function WaiterShareLink({
  venueSlug,
  staffToken,
  venueId,
  onStaffTokenRotated,
}: {
  venueSlug: string;
  staffToken: string;
  venueId?: string;
  onStaffTokenRotated?: (newToken: string) => void;
}) {
  const { d } = useDashboardCopy();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const w = d.waiter;
  const canRotate = Boolean(venueId && onStaffTokenRotated);

  useEffect(() => {
    if (!venueSlug || !staffToken) return;
    const u = new URL("/api/staff/session", clientShareOrigin());
    u.searchParams.set("venueSlug", venueSlug);
    u.searchParams.set("key", staffToken);
    setUrl(u.toString());
  }, [venueSlug, staffToken]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function rotateToken() {
    if (!venueId || !onStaffTokenRotated) return;
    if (!confirmWarning(w.rotateConfirm)) return;

    setRotating(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/rotate-staff-token`, { method: "POST" });
      const data = (await res.json()) as { staffToken?: string; message?: string; error?: string };
      if (!res.ok || !data.staffToken) {
        window.alert(data.error ?? w.rotateFailed);
        return;
      }
      onStaffTokenRotated(data.staffToken);
    } catch {
      window.alert(w.rotateFailed);
    } finally {
      setRotating(false);
    }
  }

  if (!url) return null;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" aria-hidden />
            <div>
              <p className="font-semibold text-primary">{w.shareTitle}</p>
              <p className="mt-1 text-sm text-slate-600">{w.shareDescription}</p>
              <p className="mt-2 text-xs text-slate-500">{w.sharePerDevice}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
            <input
              type="text"
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-button border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
              aria-label={w.shareTitle}
            />
            <button
              type="button"
              onClick={() => void copy()}
              className={`inline-flex items-center justify-center gap-2 ${buttonClass("primary", "sm")}`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? w.copied : w.copyLink}
            </button>
          </div>
        </div>
      </Card>

      {canRotate ? (
        <Card className="border-amber-200/80 bg-amber-50/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-primary">{w.rotateTitle}</p>
              <p className="mt-1 text-sm text-slate-600">{w.rotateDescription}</p>
            </div>
            <button
              type="button"
              disabled={rotating}
              onClick={() => void rotateToken()}
              className={`inline-flex shrink-0 items-center justify-center gap-2 ${dashboardTextActionClass("warning")}`}
              title={w.rotateTitle}
            >
              <RefreshCw className={`h-4 w-4 ${rotating ? "animate-spin" : ""}`} aria-hidden />
              {rotating ? w.rotating : w.rotateButton}
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
