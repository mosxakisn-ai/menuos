"use client";

import { ExternalLink, Store } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoUploadField } from "@/components/dashboard/photo-upload-field";
import { CuisineTypeSelect } from "@/components/dashboard/cuisine-type-select";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardLabelClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { panelPhotoDisplayUrl } from "@/lib/photo-display-url";
import type { CuisineType } from "@menuos/shared";
import { cn } from "@/lib/utils";

type Venue = SettingsVenue;

export type SettingsVenue = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cuisineType: CuisineType | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  googleReviewUrl?: string | null;
  googleReviewRating?: { toString(): string } | number | null;
  googleReviewCount?: number | null;
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={dashboardLabelClass}>{label}</span>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0 shadow-sm"
          aria-label={label}
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-600">{value}</p>
        </div>
        <div
          className="h-9 w-16 shrink-0 rounded-lg shadow-inner ring-1 ring-black/5"
          style={{ backgroundColor: value }}
          aria-hidden
        />
      </div>
    </label>
  );
}

export function SettingsForm({ venues }: { venues: SettingsVenue[] }) {
  const { d } = useDashboardCopy();
  const router = useRouter();
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [name, setName] = useState(venue?.name ?? "");
  const [description, setDescription] = useState(venue?.description ?? "");
  const [cuisineType, setCuisineType] = useState<CuisineType | "">(venue?.cuisineType ?? "");
  const [logoUrl, setLogoUrl] = useState(venue?.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(venue?.primaryColor ?? "#2563EB");
  const [secondaryColor, setSecondaryColor] = useState(venue?.secondaryColor ?? "#06B6D4");
  const [saving, setSaving] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const displayName = name.trim() || venue?.name || "";
  const logoSrc = panelPhotoDisplayUrl(logoUrl) ?? logoUrl;

  function selectVenue(id: string) {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    if (v) {
      setName(v.name);
      setDescription(v.description ?? "");
      setCuisineType(v.cuisineType ?? "");
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
          cuisineType: cuisineType || null,
          logoUrl: logoUrl.trim() || "",
          primaryColor,
          secondaryColor,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="text-center text-sm text-slate-600 sm:text-left">{d.pages.settings.needVenueFirst}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <Card className="overflow-hidden p-0 shadow-card ring-1 ring-slate-100/80">
        <div className="border-b border-slate-100/90 bg-gradient-to-br from-brand-blue/[0.06] via-white to-cyan-50/40 px-5 py-5 sm:px-6 sm:py-6">
          {venues.length > 1 ? (
            <label className="block max-w-md">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {d.venue}
              </span>
              <select
                value={venueId}
                onChange={(e) => selectVenue(e.target.value)}
                className={`mt-2 ${dashboardFieldClass}`}
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {venue ? (
            <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", venues.length > 1 && "mt-5")}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-md ring-2 ring-white"
                  style={{
                    background: logoSrc
                      ? undefined
                      : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-7 w-7 text-white/95" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {d.pages.settings.venueTab.title}
                  </p>
                  <h2 className="truncate font-serif text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.65rem]">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {d.pages.settings.venueTab.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <a
                  href={`/m/${venue.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-button bg-brand-gradient px-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95"
                >
                  {d.previewCatalog}
                  <ExternalLink className="h-3.5 w-3.5 opacity-90" />
                </a>
              </div>
            </div>
          ) : null}

          {venue ? (
            <div
              className="mt-5 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <div className="flex items-center gap-3 bg-white/10 px-4 py-3 backdrop-blur-[2px]">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/40" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Store className="h-4 w-4 text-white" aria-hidden />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white drop-shadow-sm">{displayName}</p>
                  <p className="text-[11px] text-white/80">{d.pages.settings.appearanceDesc}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {d.pages.settings.appearanceTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{d.pages.settings.appearanceDesc}</p>
          </div>

          <form onSubmit={onSubmit} className={cn(dashboardFormGridClass, "mt-6")}>
            <label className="block sm:col-span-2">
              <span className={dashboardLabelClass}>{d.pages.settings.venueNameLabel}</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.venueName}
                className={dashboardFieldClass}
              />
            </label>
            <CuisineTypeSelect
              className="sm:col-span-2"
              value={cuisineType}
              onChange={setCuisineType}
            />
            <label className="block sm:col-span-2">
              <span className={dashboardLabelClass}>{d.pages.settings.taglineLabel}</span>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{d.pages.settings.taglineHint}</p>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.venueTagline}
                className={cn(dashboardTextareaClass, "mt-2")}
              />
            </label>
            <PhotoUploadField
              className="sm:col-span-2"
              value={logoUrl}
              onChange={setLogoUrl}
              label={d.photos.logoLabel}
              hint={d.photos.logoHint}
            />
            <p className="sm:col-span-2 text-xs text-slate-500">{d.photos.logoSaveHint}</p>
            <ColorField
              label={d.pages.settings.primaryColor}
              value={primaryColor}
              onChange={setPrimaryColor}
            />
            <ColorField
              label={d.pages.settings.secondaryColor}
              value={secondaryColor}
              onChange={setSecondaryColor}
            />
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className={`h-10 w-full sm:w-auto ${buttonClass("primary", "md")}`}
              >
                {saving ? d.pages.settings.saving : d.pages.settings.save}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
