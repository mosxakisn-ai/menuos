"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DASHBOARD_EL } from "@/content/dashboard-el";

export function WaiterShareLink({
  venueSlug,
  staffToken,
}: {
  venueSlug: string;
  staffToken: string;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const w = DASHBOARD_EL.waiter;

  useEffect(() => {
    if (!venueSlug || !staffToken) return;
    const u = new URL(`/s/${venueSlug}`, window.location.origin);
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

  if (!url) return null;

  return (
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
  );
}
