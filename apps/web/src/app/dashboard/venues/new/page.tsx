"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { PlanLimitHint } from "@/components/dashboard/plan-limit-hint";
import { usePlanLimits } from "@/components/dashboard/plan-limits-provider";
import {
  DashboardPage,
  DashboardPageHeader,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { slugifyOrFallback } from "@/lib/utils";
import { DashboardDocumentTitle } from "@/components/dashboard/localized-dashboard-page-header";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { isAtVenueLimit, venueLimitMessage } from "@/lib/dashboard-plan-limits";

export default function NewVenuePage() {
  const router = useRouter();
  const { d } = useDashboardCopy();
  const planLimits = usePlanLimits();
  const atVenueLimit = planLimits ? isAtVenueLimit(planLimits) : false;
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (planLimits && isAtVenueLimit(planLimits)) {
      setFlash({ type: "error", text: venueLimitMessage(d, planLimits) });
      return;
    }
    setLoading(true);
    setFlash(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const res = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug: slugifyOrFallback(name, "venue"),
        description: form.get("description") || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      showFromResponse(data, false, res.status);
      return;
    }
    showFromResponse(data, true);
    router.push("/dashboard");
  }

  return (
    <DashboardPage className="max-w-lg">
      <DashboardDocumentTitle page="newVenue" />
      <DashboardPageHeader
        title={d.pages.newVenue.title}
        description={d.pages.newVenue.description}
      />
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />
      {atVenueLimit && planLimits ? (
        <PlanLimitHint message={venueLimitMessage(d, planLimits)} className="mb-4" />
      ) : null}
      <div className={dashboardCardClass}>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className={dashboardLabelClass}>{d.pages.newVenue.nameLabel}</span>
            <input
              name="name"
              required
              className={dashboardFieldClass}
              placeholder={FORM_PLACEHOLDERS.venueName}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{d.pages.newVenue.descriptionLabel}</span>
            <textarea
              name="description"
              rows={3}
              className={dashboardTextareaClass}
              placeholder={FORM_PLACEHOLDERS.venueDescription}
            />
          </label>
          <button
            type="submit"
            disabled={loading || atVenueLimit}
            className={`h-10 w-full sm:w-auto ${buttonClass("primary", "md")}`}
          >
            {loading ? d.pages.newVenue.submitting : d.pages.newVenue.submit}
          </button>
        </form>
      </div>
    </DashboardPage>
  );
}
