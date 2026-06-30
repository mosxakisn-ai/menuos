"use client";

import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ITEM_LABEL_OPTIONS, ITEM_LABEL_STYLES, isItemLabel, newItemExtraId, parseItemExtras, type ItemExtra, type ItemLabel } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { PhotoUploadField } from "@/components/dashboard/photo-upload-field";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DASHBOARD_EL } from "@/content/dashboard-el";

type Translation = { language: string; name: string; description?: string | null };
type Item = {
  id: string;
  price: { toString(): string };
  available: boolean;
  label: string | null;
  photoUrl: string | null;
  extras?: unknown;
  translations: Translation[];
};
type Category = {
  id: string;
  translations: Translation[];
  items: Item[];
};
type Menu = { id: string; name: string; categories: Category[] };
type Venue = { id: string; name: string; slug: string };

function parseMenuPrice(raw: string): number {
  return parseFloat(raw.trim().replace(",", "."));
}

export function MenuEditor({
  venues,
  initialVenueId,
  welcome,
  canImportPdf = false,
}: {
  venues: Venue[];
  initialVenueId?: string;
  welcome?: boolean;
  canImportPdf?: boolean;
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
        text: DASHBOARD_EL.venueCreated,
      });
    }
  }, [welcome, setFlash]);

  const [catNameGr, setCatNameGr] = useState("");
  const [catNameEn, setCatNameEn] = useState("");
  const [catNameDe, setCatNameDe] = useState("");
  const [catNameFr, setCatNameFr] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    nameGr: "",
    nameEn: "",
    nameDe: "",
    nameFr: "",
    price: "",
    descriptionGr: "",
    label: "" as "" | ItemLabel,
    photoUrl: "",
  });
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNameGr, setEditNameGr] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editExtras, setEditExtras] = useState<ItemExtra[]>([]);
  const [savingName, setSavingName] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [newMenuName, setNewMenuName] = useState("");
  const [addingMenu, setAddingMenu] = useState(false);

  const loadMenus = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/menus?venueId=${venueId}`);
      const data = await res.json();
      if (res.ok) {
        setMenus(data.menus ?? []);
        setVenue(data.venue ?? null);
        setActiveMenuId((prev) => {
          const list = data.menus ?? [];
          if (prev && list.some((m: Menu) => m.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
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
    const menuId = activeMenuId || menus[0]?.id;
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
          nameDe: catNameDe.trim() || undefined,
          nameFr: catNameFr.trim() || undefined,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setCatNameGr("");
        setCatNameEn("");
        setCatNameDe("");
        setCatNameFr("");
        await loadMenus();
      }
    } finally {
      setAddingCat(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemCategoryId || !itemForm.nameGr.trim() || !itemForm.price) return;
    const price = parseMenuPrice(itemForm.price);
    if (!Number.isFinite(price) || price < 0) {
      setFlash({ type: "error", text: "Βάλε έγκυρη τιμή (π.χ. 4.50)." });
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: itemCategoryId,
          nameGr: itemForm.nameGr.trim(),
          nameEn: itemForm.nameEn.trim() || undefined,
          nameDe: itemForm.nameDe.trim() || undefined,
          nameFr: itemForm.nameFr.trim() || undefined,
          price,
          descriptionGr: itemForm.descriptionGr.trim() || undefined,
          label: itemForm.label || undefined,
          photoUrl: itemForm.photoUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setItemForm({ nameGr: "", nameEn: "", nameDe: "", nameFr: "", price: "", descriptionGr: "", label: "", photoUrl: "" });
        setItemCategoryId(null);
        await loadMenus();
      }
    } finally {
      setAddingItem(false);
    }
  }

  async function addMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !newMenuName.trim()) return;
    setAddingMenu(true);
    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, name: newMenuName.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setNewMenuName("");
        await loadMenus();
        if (data.menu?.id) setActiveMenuId(data.menu.id);
      }
    } finally {
      setAddingMenu(false);
    }
  }

  async function setItemLabel(itemId: string, label: ItemLabel | null) {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  async function saveItemEdit(itemId: string) {
    if (!editNameGr.trim()) return;
    const price = parseMenuPrice(editPrice);
    if (!Number.isFinite(price) || price < 0) {
      setFlash({ type: "error", text: "Βάλε έγκυρη τιμή (π.χ. 4.50)." });
      return;
    }
    const extras = editExtras
      .map((e) => ({ ...e, labels: { ...e.labels, GR: e.labels.GR.trim() } }))
      .filter((e) => e.labels.GR);
    setSavingName(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameGr: editNameGr.trim(),
          price,
          photoUrl: editPhotoUrl.trim() || "",
          extras,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setEditingItemId(null);
        await loadMenus();
      }
    } finally {
      setSavingName(false);
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

  function startEditingItem(item: Item) {
    setEditingItemId(item.id);
    setEditNameGr(tName(item.translations));
    setEditPrice(item.price.toString());
    setEditPhotoUrl(item.photoUrl ?? "");
    setEditExtras(parseItemExtras(item.extras));
  }

  const activeMenu = menus.find((m) => m.id === activeMenuId) ?? menus[0];

  if (venues.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-brand-navy">Δεν έχεις ακόμα κατάστημα</p>
        <p className="mt-2 text-sm text-slate-600">
          Πρώτα φτιάξε το κατάστημά σου (εστιατόριο, bar ή ξενοδοχείο) και μετά πρόσθεσε πιάτα.
        </p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {DASHBOARD_EL.addVenue}
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm">
          <span className="font-medium text-brand-navy">{DASHBOARD_EL.venue}</span>
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
          <>
            {canImportPdf ? (
              <a
                href={`/dashboard/menus/import?venue=${venueId}`}
                className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
              >
                {DASHBOARD_EL.importPdf}
              </a>
            ) : (
              <a
                href="/dashboard/billing?upgrade=pdf-import"
                className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
              >
                {DASHBOARD_EL.importPdfPro}
              </a>
            )}
            <a
              href={`/m/${venue.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
            >
              {DASHBOARD_EL.previewCatalog}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{DASHBOARD_EL.loadingCatalog}</p>
      ) : (
        <>
          {menus.length > 0 ? (
            <Card>
              <h2 className="font-semibold text-brand-navy">{DASHBOARD_EL.menus}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {menus.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMenuId(m.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                      activeMenu?.id === m.id
                        ? "bg-brand-gradient text-white"
                        : "bg-brand-surface text-brand-navy ring-1 ring-slate-200"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <form onSubmit={addMenu} className="mt-4 flex flex-wrap items-end gap-2">
                <input
                  placeholder={DASHBOARD_EL.newCatalogPlaceholder}
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="min-w-[200px] flex-1 rounded-button border border-slate-200 px-3 py-2 text-sm"
                />
                <button type="submit" disabled={addingMenu} className={buttonClass("secondary", "sm")}>
                  {addingMenu ? "..." : DASHBOARD_EL.addCatalog}
                </button>
              </form>
            </Card>
          ) : null}

          <Card>
            <h2 className="font-semibold text-brand-navy">Νέα κατηγορία</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ελληνικά υποχρεωτικά · EN / DE / FR προαιρετικά για το QR menu
            </p>
            <form onSubmit={addCategory} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Όνομα (Ελληνικά) *"
                value={catNameGr}
                onChange={(e) => setCatNameGr(e.target.value)}
                className="rounded-button border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Name (English)"
                value={catNameEn}
                onChange={(e) => setCatNameEn(e.target.value)}
                className="rounded-button border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Name (Deutsch)"
                value={catNameDe}
                onChange={(e) => setCatNameDe(e.target.value)}
                className="rounded-button border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Nom (Français)"
                value={catNameFr}
                onChange={(e) => setCatNameFr(e.target.value)}
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

          {activeMenu?.categories.map((cat) => (
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
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0 flex-1">
                        {editingItemId === item.id ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                value={editNameGr}
                                onChange={(e) => setEditNameGr(e.target.value)}
                                placeholder="Όνομα πιάτου"
                                className="min-w-[8rem] flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
                                autoFocus
                              />
                              <label className="flex items-center gap-1.5 text-sm text-brand-navy">
                                <span className="font-medium">€</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                                />
                              </label>
                              <button
                                type="button"
                                disabled={savingName}
                                onClick={() => void saveItemEdit(item.id)}
                                className={buttonClass("primary", "sm")}
                              >
                                {savingName ? "..." : "OK"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                className={buttonClass("secondary", "sm")}
                              >
                                ✕
                              </button>
                            </div>
                            <PhotoUploadField
                              value={editPhotoUrl}
                              onChange={setEditPhotoUrl}
                            />
                            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                              <p className="text-xs font-semibold text-brand-navy">Επιλογές πελάτη</p>
                              <p className="text-[11px] leading-snug text-slate-500">
                                Ο πελάτης τις επιλέγει στο QR menu (π.χ. χωρίς αλάτι, λίγη ζάχαρη).
                              </p>
                              {editExtras.map((ex, i) => (
                                <div key={ex.id} className="flex items-center gap-2">
                                  <input
                                    value={ex.labels.GR}
                                    onChange={(e) => {
                                      const next = [...editExtras];
                                      next[i] = { ...ex, labels: { ...ex.labels, GR: e.target.value } };
                                      setEditExtras(next);
                                    }}
                                    placeholder="π.χ. Χωρίς αλάτι"
                                    className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditExtras(editExtras.filter((_, j) => j !== i))}
                                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Αφαίρεση"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              {editExtras.length < 12 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditExtras([...editExtras, { id: newItemExtraId(), labels: { GR: "" } }])
                                  }
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Προσθήκη επιλογής
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {item.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.photoUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover"
                              />
                            ) : null}
                            <p className={`font-medium ${item.available ? "text-brand-navy" : "text-slate-400 line-through"}`}>
                              {tName(item.translations)}
                            </p>
                            {isItemLabel(item.label) ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ITEM_LABEL_STYLES[item.label]}`}
                              >
                                {ITEM_LABEL_OPTIONS.find((o) => o.value === item.label)?.dashboardGr}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => startEditingItem(item)}
                              className="rounded p-1 text-slate-400 hover:text-brand-blue"
                              title="Επεξεργασία πιάτου"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {editingItemId !== item.id ? (
                          <button
                            type="button"
                            onClick={() => startEditingItem(item)}
                            className="mt-0.5 text-sm text-brand-blue hover:underline"
                            title="Αλλαγή τιμής"
                          >
                            €{item.price.toString()}
                          </button>
                        ) : null}
                        {parseItemExtras(item.extras).length > 0 ? (
                          <p className="text-[11px] text-slate-500">
                            {parseItemExtras(item.extras).length} επιλογές QR
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        <select
                          value={item.label ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            void setItemLabel(item.id, v ? (v as ItemLabel) : null);
                          }}
                          className="max-w-[8.5rem] rounded border border-slate-200 px-2 py-1 text-xs text-brand-navy"
                          title="Ετικέτα στο QR menu"
                        >
                          <option value="">Χωρίς ετικέτα</option>
                          {ITEM_LABEL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.dashboardGr}
                            </option>
                          ))}
                        </select>
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
                      placeholder="Name (Deutsch)"
                      value={itemForm.nameDe}
                      onChange={(e) => setItemForm((f) => ({ ...f, nameDe: e.target.value }))}
                      className="rounded-button border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Nom (Français)"
                      value={itemForm.nameFr}
                      onChange={(e) => setItemForm((f) => ({ ...f, nameFr: e.target.value }))}
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
                        <PhotoUploadField
                          value={itemForm.photoUrl}
                          onChange={(url) => setItemForm((f) => ({ ...f, photoUrl: url }))}
                          className="sm:col-span-2"
                        />
                    <label className="block text-sm sm:col-span-2">
                      <span className="font-medium text-brand-navy">Ετικέτα στο QR menu</span>
                      <select
                        value={itemForm.label}
                        onChange={(e) =>
                          setItemForm((f) => ({ ...f, label: e.target.value as "" | ItemLabel }))
                        }
                        className="mt-1 block w-full rounded-button border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">Χωρίς ετικέτα</option>
                        {ITEM_LABEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.dashboardGr}
                          </option>
                        ))}
                      </select>
                    </label>
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

          {activeMenu?.categories.length === 0 ? (
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
