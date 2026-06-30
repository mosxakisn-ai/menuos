"use client";

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Translation = { language: string; name: string; description?: string | null };
type Item = {
  id: string;
  price: { toString(): string };
  available: boolean;
  translations: Translation[];
};
type Category = {
  id: string;
  translations: Translation[];
  items: Item[];
};
type Menu = { id: string; name: string; categories: Category[] };
type Venue = { id: string; name: string; slug: string };

export function MenuEditor({
  venues,
  initialVenueId,
  welcome,
}: {
  venues: Venue[];
  initialVenueId?: string;
  welcome?: boolean;
}) {
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  useEffect(() => {
    if (welcome) {
      setFlash({
        type: "info",
        text: "Το venue δημιουργήθηκε! Πρόσθεσε την πρώτη κατηγορία και πιάτα για να εμφανιστεί στο QR menu.",
      });
    }
  }, [welcome, setFlash]);

  const [catNameGr, setCatNameGr] = useState("");
  const [catNameEn, setCatNameEn] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    nameGr: "",
    nameEn: "",
    price: "",
    descriptionGr: "",
  });
  const [addingItem, setAddingItem] = useState(false);

  const loadMenus = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/menus?venueId=${venueId}`);
      const data = await res.json();
      if (res.ok) {
        setMenus(data.menus ?? []);
        setVenue(data.venue ?? null);
      } else {
        showFromResponse(data, false);
      }
    } finally {
      setLoading(false);
    }
  }, [venueId, showFromResponse]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const menuId = menus[0]?.id;
    if (!menuId || !catNameGr.trim()) return;
    setAddingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId,
          nameGr: catNameGr.trim(),
          nameEn: catNameEn.trim() || undefined,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setCatNameGr("");
        setCatNameEn("");
        await loadMenus();
      }
    } finally {
      setAddingCat(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemCategoryId || !itemForm.nameGr.trim() || !itemForm.price) return;
    setAddingItem(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: itemCategoryId,
          nameGr: itemForm.nameGr.trim(),
          nameEn: itemForm.nameEn.trim() || undefined,
          price: parseFloat(itemForm.price),
          descriptionGr: itemForm.descriptionGr.trim() || undefined,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setItemForm({ nameGr: "", nameEn: "", price: "", descriptionGr: "" });
        setItemCategoryId(null);
        await loadMenus();
      }
    } finally {
      setAddingItem(false);
    }
  }

  async function toggleItem(item: Item) {
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  async function deleteItem(id: string) {
    if (!confirm("Διαγραφή πιάτου;")) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Διαγραφή κατηγορίας και όλων των πιάτων;")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  function tName(translations: Translation[]) {
    return translations.find((t) => t.language === "GR")?.name ?? translations[0]?.name ?? "—";
  }

  if (venues.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-brand-navy">Δεν υπάρχει venue ακόμα</p>
        <p className="mt-2 text-sm text-slate-600">
          Πρώτα δημιούργησε venue (π.χ. εστιατόριο ή ξενοδοχείο) και μετά πρόσθεσε πιάτα.
        </p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          Προσθήκη venue
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm">
          <span className="font-medium text-brand-navy">Venue</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="mt-1 block min-w-[200px] rounded-button border border-slate-200 px-3 py-2.5"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        {venue ? (
          <a
            href={`/m/${venue.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
          >
            Προεπισκόπηση menu
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Φόρτωση menu...</p>
      ) : (
        <>
          <Card>
            <h2 className="font-semibold text-brand-navy">Νέα κατηγορία</h2>
            <p className="mt-1 text-xs text-slate-500">π.χ. Σαλάτες, Κυρίως πιάτα, Ποτά</p>
            <form onSubmit={addCategory} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Όνομα (Ελληνικά) *"
                value={catNameGr}
                onChange={(e) => setCatNameGr(e.target.value)}
                className="rounded-button border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Name (English, optional)"
                value={catNameEn}
                onChange={(e) => setCatNameEn(e.target.value)}
                className="rounded-button border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={addingCat}
                className={`sm:col-span-2 inline-flex w-fit items-center gap-1 ${buttonClass("primary", "sm")}`}
              >
                <Plus className="h-4 w-4" />
                {addingCat ? "Προσθήκη..." : "Προσθήκη κατηγορίας"}
              </button>
            </form>
          </Card>

          {menus[0]?.categories.map((cat) => (
            <Card key={cat.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-brand-navy">{tName(cat.translations)}</h3>
                  <p className="text-xs text-slate-500">{cat.items.length} πιάτα</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Διαγραφή κατηγορίας"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <ul className="mt-4 divide-y divide-slate-100">
                {cat.items.length === 0 ? (
                  <li className="py-3 text-sm text-slate-500">Δεν υπάρχουν πιάτα — πρόσθεσε το πρώτο.</li>
                ) : (
                  cat.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 py-3">
                      <div className="min-w-0">
                        <p className={`font-medium ${item.available ? "text-brand-navy" : "text-slate-400 line-through"}`}>
                          {tName(item.translations)}
                        </p>
                        <p className="text-sm text-brand-blue">€{item.price.toString()}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => toggleItem(item)}
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            item.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.available ? "Ενεργό" : "Ανενεργό"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="rounded p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {itemCategoryId === cat.id ? (
                <form onSubmit={addItem} className="mt-4 space-y-2 rounded-lg bg-brand-surface p-4">
                  <p className="text-sm font-semibold text-brand-navy">Νέο πιάτο</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Όνομα (Ελληνικά) *"
                      value={itemForm.nameGr}
                      onChange={(e) => setItemForm((f) => ({ ...f, nameGr: e.target.value }))}
                      className="rounded-button border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Name (English)"
                      value={itemForm.nameEn}
                      onChange={(e) => setItemForm((f) => ({ ...f, nameEn: e.target.value }))}
                      className="rounded-button border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Τιμή (€) *"
                      value={itemForm.price}
                      onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                      className="rounded-button border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Περιγραφή (Ελληνικά)"
                      value={itemForm.descriptionGr}
                      onChange={(e) => setItemForm((f) => ({ ...f, descriptionGr: e.target.value }))}
                      className="rounded-button border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={addingItem} className={buttonClass("primary", "sm")}>
                      {addingItem ? "Αποθήκευση..." : "Αποθήκευση πιάτου"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemCategoryId(null)}
                      className={buttonClass("secondary", "sm")}
                    >
                      Ακύρωση
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setItemCategoryId(cat.id)}
                  className={`mt-4 inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                >
                  <Plus className="h-4 w-4" />
                  Προσθήκη πιάτου
                </button>
              )}
            </Card>
          ))}

          {menus[0]?.categories.length === 0 ? (
            <Card className="border-dashed">
              <p className="text-center text-sm text-slate-500">
                Δεν υπάρχουν κατηγορίες. Πρόσθεσε την πρώτη παραπάνω για να ξεκινήσεις.
              </p>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
