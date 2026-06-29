"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/marketing/site-chrome";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

export default function NewVenuePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const res = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug: slugify(name),
        description: form.get("description") || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create venue");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        ← Back
      </Link>
      <Card className="mt-4">
        <h1 className="font-serif text-xl font-bold text-primary">Add venue</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-primary">Venue name</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
              placeholder="Marine Hotel"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-primary">Description (optional)</span>
            <textarea
              name="description"
              rows={3}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={loading} className={buttonClass("primary")}>
            {loading ? "Saving..." : "Create venue"}
          </button>
        </form>
      </Card>
    </div>
  );
}
