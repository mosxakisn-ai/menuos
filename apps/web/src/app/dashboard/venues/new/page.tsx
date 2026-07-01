"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
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

export default function NewVenuePage() {
  const router = useRouter();
  const { d } = useDashboardCopy();
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      showFromResponse(data, false);
      return;
    }
    showFromResponse(data, true);
    setTimeout(() => {
      router.push(`/dashboard/menus?venue=${data.venue.id}&welcome=1`);
      router.refresh();
    }, 800);
  }

  return (
    <DashboardPage className="max-w-lg">
      <DashboardDocumentTitle page="newVenue" />
      <DashboardPageHeader
        title={d.pages.newVenue.title}
        description={d.pages.newVenue.description}
      />
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />
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
          <button type="submit" disabled={loading} className={`h-10 w-full sm:w-auto ${buttonClass("primary", "md")}`}>
            {loading ? d.pages.newVenue.submitting : d.pages.newVenue.submit}
          </button>
        </form>
      </div>
    </DashboardPage>
  );
}
