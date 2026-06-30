"use client";

import { Download, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DASHBOARD_EL } from "@/content/dashboard-el";

type Venue = { id: string; name: string; slug: string };

export function QrGenerator({
  venues,
  initialVenueId,
  itemCountByVenue = {},
}: {
  venues: Venue[];
  initialVenueId?: string;
  itemCountByVenue?: Record<string, number>;
}) {
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [table, setTable] = useState("");
  const [room, setRoom] = useState("");
  const [lang, setLang] = useState<"gr" | "en">("gr");
  const [menuUrl, setMenuUrl] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const generate = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ venueId });
      if (table) params.set("table", table);
      if (room) params.set("room", room);
      if (lang === "en") params.set("lang", "en");
      const res = await fetch(`/api/qr?${params}`);
      const data = await res.json();
      if (res.ok) {
        setMenuUrl(data.menuUrl);
        setPngDataUrl(data.pngDataUrl);
        setFlash({ type: "success", text: "Το QR δημιουργήθηκε! Κατέβασέ το ή εκτύπωσέ το." });
      } else {
        showFromResponse(data, false);
      }
    } finally {
      setLoading(false);
    }
  }, [venueId, table, room, lang, showFromResponse, setFlash]);

  useEffect(() => {
    if (venueId) void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate when venueId changes only
  }, [venueId]);

  function downloadPng() {
    if (!pngDataUrl) return;
    const a = document.createElement("a");
    a.href = pngDataUrl;
    a.download = `menuos-qr-${table || room || "general"}.png`;
    a.click();
  }

  const itemCount = itemCountByVenue[venueId] ?? 0;

  if (venues.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-brand-navy">Χρειάζεσαι πρώτα κατάστημα</p>
        <p className="mt-2 text-sm text-slate-600">Φτιάξε κατάστημα και πρόσθεσε πιάτα πριν βγάλεις QR.</p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {DASHBOARD_EL.addVenue}
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {itemCount === 0 ? (
        <div
          role="alert"
          className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-semibold">Ο κατάλογος είναι άδειος</p>
          <p className="mt-1">
            Πρόσθεσε κατηγορίες και πιάτα στον{" "}
            <a href={`/dashboard/menus?venue=${venueId}`} className="font-semibold underline">
              κατάλογο
            </a>{" "}
            πριν μοιράσεις QR στους πελάτες.
          </p>
        </div>
      ) : null}

      <Card>
        <h2 className="font-semibold text-brand-navy">Ρυθμίσεις QR</h2>
        <p className="mt-1 text-sm text-slate-600">
          Κάθε QR ανοίγει τον online κατάλογο. Βάλε αριθμό τραπεζιού ή δωματίου — έτσι ξέρεις από πού σε καλούν.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">{DASHBOARD_EL.venue}</span>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Τραπέζι (προαιρετικό)</span>
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="12"
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Δωμάτιο (προαιρετικό)</span>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="204"
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Προεπιλεγμένη γλώσσα QR</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as "gr" | "en")}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            >
              <option value="gr">Ελληνικά</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className={`mt-4 ${buttonClass("primary")}`}
        >
          {loading ? "Δημιουργία..." : "Ενημέρωση QR"}
        </button>
      </Card>

      {pngDataUrl ? (
        <Card className="text-center">
          <img src={pngDataUrl} alt="QR code menu" className="mx-auto h-64 w-64 rounded-lg shadow-card" />
          <p className="mt-4 break-all text-xs text-slate-500">{menuUrl}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={downloadPng} className={`inline-flex items-center gap-1 ${buttonClass("primary")}`}>
              <Download className="h-4 w-4" />
              Κατέβασμα PNG
            </button>
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 ${buttonClass("secondary")}`}
            >
              Άνοιγμα καταλόγου
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
