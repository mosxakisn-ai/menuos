"use client";

import { useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Venue = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primaryColor: string;
  secondaryColor: string;
};

export function SettingsForm({ venues }: { venues: Venue[] }) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [name, setName] = useState(venue?.name ?? "");
  const [description, setDescription] = useState(venue?.description ?? "");
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
        body: JSON.stringify({ name, description: description || undefined, primaryColor, secondaryColor }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
    } finally {
      setSaving(false);
    }
  }

  if (venues.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Δημιούργησε venue για να ρυθμίσεις branding και χρώματα.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <label className="block text-sm">
        <span className="font-medium text-brand-navy">Venue</span>
        <select
          value={venueId}
          onChange={(e) => selectVenue(e.target.value)}
          className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>

      <Card>
        <h2 className="font-semibold text-brand-navy">Branding & εμφάνιση menu</h2>
        <p className="mt-1 text-xs text-slate-500">Τα χρώματα εμφανίζονται στο public QR menu.</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Όνομα venue</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Περιγραφή</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="font-medium">Κύριο χρώμα</span>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-200"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Δευτερεύον</span>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-200"
              />
            </label>
          </div>
          <button type="submit" disabled={saving} className={buttonClass("primary")}>
            {saving ? "Αποθήκευση..." : "Αποθήκευση ρυθμίσεων"}
          </button>
        </form>
      </Card>
    </div>
  );
}
