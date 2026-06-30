"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { slugifyOrFallback } from "@/lib/utils";

export default function NewVenuePage() {
  const router = useRouter();
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
    <div className="max-w-lg space-y-4">
      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        ← Πίσω
      </Link>
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />
      <Card>
        <h1 className="font-serif text-xl font-bold text-primary">Νέο κατάστημα</h1>
        <p className="mt-2 text-sm text-slate-600">
          Το εστιατόριο, bar ή ξενοδοχείο σου. Θα δημιουργηθεί αυτόματα ο πρώτος κατάλογος.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-primary">Όνομα καταστήματος *</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
              placeholder="Marine Hotel"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-primary">Περιγραφή (προαιρετικό)</span>
            <textarea
              name="description"
              rows={3}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
              placeholder="Pool bar & restaurant στη Ρόδο"
            />
          </label>
          <button type="submit" disabled={loading} className={buttonClass("primary")}>
            {loading ? "Δημιουργία..." : "Δημιουργία καταστήματος"}
          </button>
        </form>
      </Card>
    </div>
  );
}
