"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoUploadField } from "@/components/dashboard/photo-upload-field";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardLabelClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { DASHBOARD_EL } from "@/content/dashboard-el";
import { cn } from "@/lib/utils";

type Venue = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

export function SettingsForm({ venues }: { venues: Venue[] }) {
  const router = useRouter();
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [name, setName] = useState(venue?.name ?? "");
  const [description, setDescription] = useState(venue?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(venue?.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(venue?.primaryColor ?? "#2563EB");
  const [secondaryColor, setSecondaryColor] = useState(venue?.secondaryColor ?? "#06B6D4");
  const [saving, setSaving] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  function selectVenue(id: string) {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    if (v) {
      setName(v.name);
      setDescription(v.description ?? "");
      setLogoUrl(v.logoUrl ?? "");
      setPrimaryColor(v.primaryColor);
      setSecondaryColor(v.secondaryColor);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          logoUrl: logoUrl.trim() || "",
          primaryColor,
          secondaryColor,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="text-center text-sm text-slate-600 sm:text-left">
          Φτιάξε πρώτα κατάστημα για να ρυθμίσεις χρώματα και εμφάνιση.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={dashboardCardClass}>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-brand-navy">Εμφάνιση καταλόγου</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Logo, χρώματα και στοιχεία που βλέπουν οι πελάτες από το QR.
            </p>
          </div>
          <label className="block w-full sm:max-w-xs sm:shrink-0">
            <span className={dashboardLabelClass}>{DASHBOARD_EL.venue}</span>
            <select
              value={venueId}
              onChange={(e) => selectVenue(e.target.value)}
              className={dashboardFieldClass}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form onSubmit={onSubmit} className={cn(dashboardFormGridClass, "mt-6")}>
          <label className="block sm:col-span-2">
            <span className={dashboardLabelClass}>Όνομα καταστήματος</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={dashboardFieldClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={dashboardLabelClass}>Περιγραφή</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={dashboardTextareaClass}
            />
          </label>
          <PhotoUploadField
            className="sm:col-span-2"
            value={logoUrl}
            onChange={setLogoUrl}
            label={DASHBOARD_EL.photos.logoLabel}
            hint={DASHBOARD_EL.photos.logoHint}
          />
          <p className="sm:col-span-2 text-xs text-slate-500">{DASHBOARD_EL.photos.logoSaveHint}</p>
          <label className="block">
            <span className={dashboardLabelClass}>Κύριο χρώμα</span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="mt-1.5 h-10 w-full cursor-pointer rounded-button border border-slate-200 bg-white shadow-sm"
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>Δευτερεύον</span>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="mt-1.5 h-10 w-full cursor-pointer rounded-button border border-slate-200 bg-white shadow-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={`h-10 w-full sm:w-auto ${buttonClass("primary", "md")}`}>
              {saving ? "Αποθήκευση..." : "Αποθήκευση ρυθμίσεων"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
