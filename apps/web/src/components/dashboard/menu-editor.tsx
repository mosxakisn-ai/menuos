"use client";

import { ExternalLink, FileUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ITEM_LABEL_OPTIONS, isItemLabel, newItemExtraId, parseAllergenCodes, parseDietaryTags, parseItemExtras, type ItemExtra, type ItemLabel } from "@menuos/shared";
import { LoadingSkeleton, LoadingState } from "@/components/ui/loading-state";
import { panelPhotoDisplayUrl } from "@/lib/photo-display-url";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardInputClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { PhotoUploadField } from "@/components/dashboard/photo-upload-field";
import {
  MenuItemDetailFields,
  type MenuItemDetailFormValue,
} from "@/components/dashboard/menu-item-detail-fields";
import { ProFeatureLink } from "@/components/dashboard/pro-feature-link";
import { PlanLimitHint } from "@/components/dashboard/plan-limit-hint";
import { usePlanLimits } from "@/components/dashboard/plan-limits-provider";
import { MenuItemPhotoPlaceholder } from "@/components/menu/menu-item-photo-placeholder";
import { ItemLabelBadge } from "@/components/menu/menu-item-card";
import { DashboardScrollRow } from "@/components/dashboard/dashboard-ui";
import { dashboardIconButtonClass } from "@/components/dashboard/dashboard-action-button";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { confirmDestructive } from "@/lib/confirm-action";
import { buildMenusImportUrl, buildMenusPageUrl, buildBillingUpgradeUrl, resolveMenuIdForVenue } from "@/lib/menus-nav-url";
import { useMenusNavUrlFill } from "@/lib/use-menus-nav-url-fill";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import {
  catalogLimitMessage,
  isAtCatalogLimit,
  isAtItemLimit,
  itemLimitMessage,
  itemNearLimitMessage,
  type DashboardPlanLimitsSnapshot,
} from "@/lib/dashboard-plan-limits";
import { cn } from "@/lib/utils";

type Translation = {
  language: string;
  name: string;
  description?: string | null;
  ingredients?: string | null;
  allergens?: string | null;
};
type Item = {
  id: string;
  price: { toString(): string };
  available: boolean;
  label: string | null;
  photoUrl: string | null;
  dietaryTags?: unknown;
  allergenCodes?: unknown;
  extras?: unknown;
  translations: Translation[];
};

const EMPTY_ITEM_DETAIL: MenuItemDetailFormValue = {
  descriptionGr: "",
  ingredientsGr: "",
  dietaryTags: [],
  allergenCodes: [],
};

type ItemEditSnapshot = {
  nameGr: string;
  price: string;
  photoUrl: string;
  extrasJson: string;
  detail: MenuItemDetailFormValue;
};

function cloneItemDetail(detail: MenuItemDetailFormValue): MenuItemDetailFormValue {
  return {
    descriptionGr: detail.descriptionGr,
    ingredientsGr: detail.ingredientsGr,
    dietaryTags: [...detail.dietaryTags],
    allergenCodes: [...detail.allergenCodes],
  };
}

function itemDetailEqual(a: MenuItemDetailFormValue, b: MenuItemDetailFormValue): boolean {
  return (
    a.descriptionGr.trim() === b.descriptionGr.trim() &&
    a.ingredientsGr.trim() === b.ingredientsGr.trim() &&
    JSON.stringify([...a.dietaryTags].sort()) === JSON.stringify([...b.dietaryTags].sort()) &&
    JSON.stringify([...a.allergenCodes].sort()) === JSON.stringify([...b.allergenCodes].sort())
  );
}

function normalizeExtrasForCompare(extras: ItemExtra[]): string {
  return JSON.stringify(
    extras
      .map((e) => ({ ...e, labels: { ...e.labels, GR: e.labels.GR.trim() } }))
      .filter((e) => e.labels.GR)
      .map((e) => {
        const out: ItemExtra = { id: e.id, labels: e.labels };
        if (e.price != null && Number.isFinite(e.price) && e.price > 0) {
          out.price = Math.round(e.price * 100) / 100;
        }
        return out;
      }),
  );
}
type Category = {
  id: string;
  translations: Translation[];
  items: Item[];
};
type Menu = { id: string; name: string; categories: Category[] };
type Venue = { id: string; name: string; slug: string };

function catalogTotals(menus: Menu[]) {
  let categories = 0;
  let items = 0;
  for (const menu of menus) {
    categories += menu.categories.length;
    for (const cat of menu.categories) {
      items += cat.items.length;
    }
  }
  return { menus: menus.length, categories, items };
}

function menuCatalogStats(menu: Menu) {
  const categories = menu.categories.length;
  const items = menu.categories.reduce((n, cat) => n + cat.items.length, 0);
  return { categories, items };
}

function parseMenuPrice(raw: string): number {
  return parseFloat(raw.trim().replace(",", "."));
}

export function MenuEditor({
  venues,
  initialVenueId,
  welcome,
  canImportPdf = false,
  readOnlyDuringOnboarding = false,
}: {
  venues: Venue[];
  initialVenueId?: string;
  welcome?: boolean;
  canImportPdf?: boolean;
  readOnlyDuringOnboarding?: boolean;
}) {
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const { d } = useDashboardCopy();
  const planLimitsBase = usePlanLimits();
  const [itemCountLive, setItemCountLive] = useState<number | null>(null);
  const planLimits: DashboardPlanLimitsSnapshot | null = planLimitsBase
    ? { ...planLimitsBase, itemCount: itemCountLive ?? planLimitsBase.itemCount }
    : null;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (welcome) {
      setFlash({
        type: "info",
        text: d.venueCreated,
      });
    }
  }, [welcome, setFlash, d.venueCreated]);

  const [catNameGr, setCatNameGr] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    nameGr: "",
    price: "",
    label: "" as "" | ItemLabel,
    photoUrl: "",
    ...EMPTY_ITEM_DETAIL,
  });
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryNameGr, setEditCategoryNameGr] = useState("");
  const [editNameGr, setEditNameGr] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editExtras, setEditExtras] = useState<ItemExtra[]>([]);
  const [editDetail, setEditDetail] = useState<MenuItemDetailFormValue>(EMPTY_ITEM_DETAIL);
  const [savingName, setSavingName] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [newMenuName, setNewMenuName] = useState("");
  const [addingMenu, setAddingMenu] = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null);
  const [deletingAllMenus, setDeletingAllMenus] = useState(false);
  const scrollRestoreRef = useRef<number | null>(null);
  const refreshSeqRef = useRef(0);
  const editSnapshotRef = useRef<ItemEditSnapshot | null>(null);

  const restoreScrollAfterRefresh = useCallback(() => {
    const y = scrollRestoreRef.current;
    scrollRestoreRef.current = null;
    if (y == null) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "instant" }));
    });
  }, []);

  const loadMenus = useCallback(
    async (options?: { background?: boolean }) => {
      if (!venueId) return;
      let refreshSeq = 0;
      if (options?.background) {
        refreshSeq = ++refreshSeqRef.current;
        scrollRestoreRef.current = window.scrollY;
      } else {
        setLoading(true);
      }
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
          if (options?.background && refreshSeq === refreshSeqRef.current) {
            restoreScrollAfterRefresh();
          }
        } else {
          if (options?.background && refreshSeq === refreshSeqRef.current) {
            scrollRestoreRef.current = null;
          }
          showFromResponse(data, false, res.status);
        }
      } finally {
        if (!options?.background) setLoading(false);
      }
    },
    [venueId, showFromResponse, restoreScrollAfterRefresh],
  );

  const refreshMenus = useCallback(() => loadMenus({ background: true }), [loadMenus]);

  useEffect(() => {
    const venueParam = searchParams.get("venue");
    if (venueParam && venueParam !== venueId) {
      setVenueId(venueParam);
    }
  }, [searchParams, venueId]);

  useEffect(() => {
    if (menus.length === 0) return;
    const resolved = resolveMenuIdForVenue(searchParams.get("menu"), menus);
    setActiveMenuId((prev) => (prev === resolved ? prev : resolved));
  }, [searchParams, menus]);

  useMenusNavUrlFill("catalog", { venueId, menuId: activeMenuId || undefined }, Boolean(venueId && activeMenuId));

  function selectActiveMenu(id: string) {
    setActiveMenuId(id);
    if (venueId) {
      router.replace(buildMenusPageUrl({ venueId, menuId: id }), { scroll: false });
    }
  }

  function changeVenue(nextVenueId: string) {
    setVenueId(nextVenueId);
    setActiveMenuId("");
    router.replace(buildMenusPageUrl({ venueId: nextVenueId }), { scroll: false });
  }

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
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setCatNameGr("");
        await refreshMenus();
      }
    } finally {
      setAddingCat(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemCategoryId || !itemForm.nameGr.trim() || !itemForm.price) return;
    if (planLimits && isAtItemLimit(planLimits)) {
      setFlash({ type: "error", text: itemLimitMessage(d, planLimits) });
      return;
    }
    const price = parseMenuPrice(itemForm.price);
    if (!Number.isFinite(price) || price < 0) {
      setFlash({ type: "error", text: d.menuEditor.invalidPrice });
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
          price,
          descriptionGr: itemForm.descriptionGr.trim() || undefined,
          ingredientsGr: itemForm.ingredientsGr.trim() || undefined,
          dietaryTags: itemForm.dietaryTags.length ? itemForm.dietaryTags : undefined,
          allergenCodes: itemForm.allergenCodes.length ? itemForm.allergenCodes : undefined,
          label: itemForm.label || undefined,
          photoUrl: itemForm.photoUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setItemForm({ nameGr: "", price: "", label: "", photoUrl: "", ...EMPTY_ITEM_DETAIL });
        setItemCategoryId(null);
        setItemCountLive((n) => (n ?? planLimitsBase?.itemCount ?? 0) + 1);
        await refreshMenus();
      }
    } finally {
      setAddingItem(false);
    }
  }

  async function addMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !newMenuName.trim()) return;
    if (planLimits && isAtCatalogLimit(planLimits, menus.length)) {
      setFlash({ type: "error", text: catalogLimitMessage(d, planLimits) });
      return;
    }
    setAddingMenu(true);
    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, name: newMenuName.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setNewMenuName("");
        await refreshMenus();
        if (data.menu?.id) setActiveMenuId(data.menu.id);
      }
    } finally {
      setAddingMenu(false);
    }
  }

  function canDeleteMenu(_menu: Menu) {
    return menus.length > 1;
  }

  async function deleteAllMenus() {
    if (!venueId || menus.length === 0) return;

    const totals = catalogTotals(menus);
    if (!(await confirmDestructive(d.deleteAllCatalogsConfirm(totals)))) return;

    setDeletingAllMenus(true);
    try {
      const res = await fetch(`/api/menus?venueId=${encodeURIComponent(venueId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        clearMenuEditState();
        setActiveMenuId(data.menu?.id ?? "");
        await refreshMenus();
      }
    } finally {
      setDeletingAllMenus(false);
    }
  }

  function clearMenuEditState() {
    setEditingItemId(null);
    setEditingCategoryId(null);
    setItemCategoryId(null);
  }

  async function deleteMenu(menu: Menu) {
    if (menus.length <= 1) {
      setFlash({ type: "error", text: d.deleteCatalogLast });
      return;
    }

    const stats = menuCatalogStats(menu);
    const confirmMessage =
      stats.categories > 0 || stats.items > 0
        ? d.deleteCatalogWithDataConfirm(menu.name, stats)
        : d.deleteCatalogConfirm(menu.name);
    if (!(await confirmDestructive(confirmMessage))) return;

    setDeletingMenuId(menu.id);
    try {
      const res = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        if (activeMenuId === menu.id) {
          clearMenuEditState();
          const next = menus.find((m) => m.id !== menu.id);
          setActiveMenuId(next?.id ?? "");
        }
        await refreshMenus();
      }
    } finally {
      setDeletingMenuId(null);
    }
  }

  async function setItemLabel(itemId: string, label: ItemLabel | null) {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    showFromResponse(data, res.ok, res.status);
    if (res.ok) await refreshMenus();
  }

  async function saveItemEdit(itemId: string) {
    if (!editNameGr.trim()) return;
    const price = parseMenuPrice(editPrice);
    if (!Number.isFinite(price) || price < 0) {
      setFlash({ type: "error", text: d.menuEditor.invalidPrice });
      return;
    }
    const extras = editExtras
      .map((e) => ({ ...e, labels: { ...e.labels, GR: e.labels.GR.trim() } }))
      .filter((e) => e.labels.GR)
      .map((e) => {
        const out: ItemExtra = { id: e.id, labels: e.labels };
        if (e.price != null && Number.isFinite(e.price) && e.price > 0) {
          out.price = Math.round(e.price * 100) / 100;
        }
        return out;
      });
    const snapshot = editSnapshotRef.current;
    const patchBody: Record<string, unknown> = {};
    const trimmedName = editNameGr.trim();
    if (trimmedName !== snapshot?.nameGr) patchBody.nameGr = trimmedName;
    if (price.toString() !== snapshot?.price) patchBody.price = price;
    if ((editPhotoUrl.trim() || "") !== (snapshot?.photoUrl ?? "")) {
      patchBody.photoUrl = editPhotoUrl.trim() || "";
    }
    if (normalizeExtrasForCompare(extras) !== (snapshot?.extrasJson ?? "")) {
      patchBody.extras = extras;
    }
    if (!itemDetailEqual(editDetail, snapshot?.detail ?? EMPTY_ITEM_DETAIL)) {
      patchBody.descriptionGr = editDetail.descriptionGr;
      patchBody.ingredientsGr = editDetail.ingredientsGr;
      patchBody.dietaryTags = editDetail.dietaryTags;
      patchBody.allergenCodes = editDetail.allergenCodes;
    }
    if (Object.keys(patchBody).length === 0) {
      setEditingItemId(null);
      editSnapshotRef.current = null;
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setEditingItemId(null);
        editSnapshotRef.current = null;
        await refreshMenus();
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
    showFromResponse(data, res.ok, res.status);
    if (res.ok) await refreshMenus();
  }

  async function deleteItem(id: string) {
    if (!(await confirmDestructive(d.catalogEntry.deleteConfirm))) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const data = await res.json();
    showFromResponse(data, res.ok, res.status);
    if (res.ok) await refreshMenus();
  }

  async function deleteCategory(cat: Category) {
    if (cat.items.length > 0) {
      setFlash({
        type: "error",
        text: d.catalogEntry.categoryHasEntries,
      });
      return;
    }
    if (!(await confirmDestructive(d.menuEditor.deleteCategoryConfirm))) {
      return;
    }
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    const data = await res.json();
    showFromResponse(data, res.ok, res.status);
    if (res.ok) await refreshMenus();
  }

  function tName(translations: Translation[]) {
    return translations.find((t) => t.language === "GR")?.name ?? translations[0]?.name ?? "—";
  }

  function tGrField(item: Item, field: "description" | "ingredients") {
    return item.translations.find((t) => t.language === "GR")?.[field]?.trim() ?? "";
  }

  function startEditingCategory(cat: Category) {
    setEditingItemId(null);
    setItemCategoryId(null);
    setEditingCategoryId(cat.id);
    setEditCategoryNameGr(tName(cat.translations));
  }

  async function saveCategoryEdit(categoryId: string) {
    if (!editCategoryNameGr.trim()) {
      setFlash({ type: "error", text: d.menuEditor.categoryNameRequired });
      return;
    }
    setSavingCategory(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameGr: editCategoryNameGr.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setEditingCategoryId(null);
        await refreshMenus();
      }
    } finally {
      setSavingCategory(false);
    }
  }

  function startEditingItem(item: Item) {
    setEditingCategoryId(null);
    setItemCategoryId(null);
    setEditingItemId(item.id);
    setEditNameGr(tName(item.translations));
    setEditPrice(item.price.toString());
    setEditPhotoUrl(item.photoUrl ?? "");
    setEditExtras(parseItemExtras(item.extras));
    const detail = {
      descriptionGr: tGrField(item, "description"),
      ingredientsGr: tGrField(item, "ingredients"),
      dietaryTags: parseDietaryTags(item.dietaryTags),
      allergenCodes: parseAllergenCodes(item.allergenCodes),
    };
    setEditDetail(detail);
    editSnapshotRef.current = {
      nameGr: tName(item.translations),
      price: item.price.toString(),
      photoUrl: item.photoUrl ?? "",
      extrasJson: normalizeExtrasForCompare(parseItemExtras(item.extras)),
      detail: cloneItemDetail(detail),
    };
  }

  const activeMenu = menus.find((m) => m.id === activeMenuId) ?? menus[0];
  const ro = readOnlyDuringOnboarding;
  const atCatalogLimit = planLimits ? isAtCatalogLimit(planLimits, menus.length) : false;
  const atItemLimit = planLimits ? isAtItemLimit(planLimits) : false;
  const itemNearLimit = planLimits ? itemNearLimitMessage(d, planLimits) : null;

  function tryOpenAddItem(categoryId: string) {
    if (planLimits && isAtItemLimit(planLimits)) {
      setFlash({ type: "error", text: itemLimitMessage(d, planLimits) });
      return;
    }
    setEditingCategoryId(null);
    setItemCategoryId(categoryId);
  }

  if (venues.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-brand-navy">{d.menuEditor.noVenueTitle}</p>
        <p className="mt-2 text-sm text-slate-600">{d.menuEditor.noVenueDesc}</p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {d.addVenue}
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {!ro && itemNearLimit && !atItemLimit ? (
        <PlanLimitHint message={itemNearLimit} />
      ) : null}

      {!ro && atItemLimit && planLimits ? (
        <PlanLimitHint message={itemLimitMessage(d, planLimits)} />
      ) : null}

      {ro ? (
        <div className="rounded-xl border border-brand-blue/15 bg-brand-blue/[0.04] px-4 py-3 text-sm text-slate-600">
          {d.menuEditor.onboardingReadOnlyBanner}
        </div>
      ) : null}

      {loading ? (
        <Card className="overflow-hidden p-0 shadow-card ring-1 ring-slate-100/80">
          <LoadingState
            variant="catalog"
            size="md"
            title={d.loadingCatalog}
            subtitle={d.menuEditor.loadingSubtitle}
          />
          <LoadingSkeleton rows={2} className="mt-2 px-4 pb-4" />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 shadow-card ring-1 ring-slate-100/80">
          <div className="border-b border-slate-100/90 bg-gradient-to-br from-brand-blue/[0.06] via-white to-cyan-50/40 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="min-w-0 flex-1 sm:max-w-sm">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {d.venue}
                </span>
                <select
                  value={venueId}
                  onChange={(e) => changeVenue(e.target.value)}
                  className={`mt-2 ${dashboardFieldClass}`}
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              {venue ? (
                <div className="flex flex-wrap items-center gap-2">
                  {!ro ? (
                    canImportPdf ? (
                      <a
                        href={buildMenusImportUrl({ venueId, menuId: activeMenuId || undefined })}
                        className="inline-flex h-10 items-center gap-2 rounded-button border border-slate-200/90 bg-white px-3.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-blue/[0.04]"
                      >
                        <FileUp className="h-4 w-4 text-brand-blue" />
                        {d.importPdfButton}
                      </a>
                    ) : (
                      <ProFeatureLink
                        href={buildBillingUpgradeUrl("pdf-import", {
                          venueId,
                          menuId: activeMenuId || undefined,
                        })}
                        icon={<FileUp className="h-4 w-4 text-brand-blue transition group-hover:scale-105" />}
                        label={d.importPdfButton}
                      />
                    )
                  ) : null}
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
              ) : null}
            </div>
          </div>

          {menus.length > 0 ? (
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {d.menus}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{d.menuEditor.syncCatalogHint}</p>
                </div>
                {!ro ? (
                  <button
                    type="button"
                    disabled={deletingAllMenus}
                    onClick={() => void deleteAllMenus()}
                    className="text-xs font-semibold text-red-600/90 underline-offset-2 transition hover:text-red-700 hover:underline disabled:opacity-50"
                  >
                    {deletingAllMenus ? "..." : d.deleteAllCatalogs}
                  </button>
                ) : null}
              </div>

              <DashboardScrollRow className="mt-4" innerClassName="flex gap-2 pb-0.5">
                {menus.map((m) => {
                  const isActive = activeMenu?.id === m.id;
                  const deletable = canDeleteMenu(m);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "inline-flex shrink-0 items-stretch overflow-hidden rounded-full text-sm font-semibold transition-shadow",
                        isActive
                          ? "bg-brand-gradient text-white shadow-glow"
                          : "bg-brand-surface text-brand-navy ring-1 ring-slate-200/90 hover:ring-brand-blue/25",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectActiveMenu(m.id)}
                        className="px-4 py-2"
                      >
                        {m.name}
                      </button>
                      {deletable && !ro ? (
                        <button
                          type="button"
                          disabled={deletingMenuId === m.id}
                          onClick={() => void deleteMenu(m)}
                          className={cn(
                            "inline-flex items-center border-l px-2 py-2 transition",
                            isActive
                              ? "border-white/30 hover:bg-white/15 hover:text-white"
                              : "border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700",
                          )}
                          aria-label={d.deleteCatalog}
                          title={d.deleteCatalog}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </DashboardScrollRow>

              {!ro && atCatalogLimit && planLimits ? (
                <PlanLimitHint message={catalogLimitMessage(d, planLimits)} className="mt-4" />
              ) : null}

              {!ro ? (
                <form
                  onSubmit={addMenu}
                  className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/50 p-3 sm:flex-row sm:items-center"
                >
                  <input
                    placeholder={d.newCatalogPlaceholder}
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    disabled={atCatalogLimit}
                    className={`min-w-0 flex-1 border-0 bg-transparent shadow-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ${dashboardInputClass}`}
                  />
                  <button
                    type="submit"
                    disabled={addingMenu || atCatalogLimit}
                    className={`inline-flex shrink-0 items-center gap-1.5 ${buttonClass("primary", "sm")}`}
                  >
                    <Plus className="h-4 w-4" />
                    {addingMenu ? "..." : d.addCatalog}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </Card>
      )}

      {!loading ? (
        <>
          {!ro ? (
            <Card>
              <h2 className="font-semibold text-brand-navy">{d.menuEditor.categoryNew}</h2>
              <p className="mt-1 text-xs text-slate-500">{d.menuEditor.categoryHint}</p>
              <form onSubmit={addCategory} className="mt-4 flex flex-wrap items-end gap-2">
                <input
                  required
                  placeholder={`${FORM_PLACEHOLDERS.categoryGr} *`}
                  value={catNameGr}
                  onChange={(e) => setCatNameGr(e.target.value)}
                  className={`min-w-[200px] flex-1 ${dashboardFieldClass}`}
                />
                <button
                  type="submit"
                  disabled={addingCat}
                  className={`inline-flex w-fit items-center gap-1 ${buttonClass("primary", "sm")}`}
                >
                  <Plus className="h-4 w-4" />
                  {addingCat ? d.menuEditor.addingCategory : d.menuEditor.addCategory}
                </button>
              </form>
            </Card>
          ) : null}

          {activeMenu?.categories.map((cat) => (
            <Card key={cat.id} className="overflow-hidden p-0">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {d.menuEditor.categoryLabel}
                  </p>
                  {editingCategoryId === cat.id ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        value={editCategoryNameGr}
                        onChange={(e) => setEditCategoryNameGr(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveCategoryEdit(cat.id);
                          if (e.key === "Escape") setEditingCategoryId(null);
                        }}
                        placeholder={FORM_PLACEHOLDERS.categoryGr}
                        className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 font-serif text-lg font-bold text-brand-navy"
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={savingCategory}
                        onClick={() => void saveCategoryEdit(cat.id)}
                        className={buttonClass("primary", "sm")}
                      >
                        {savingCategory ? "..." : "OK"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className={buttonClass("secondary", "sm")}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex min-w-0 items-center gap-2">
                      <h3 className="truncate font-serif text-xl font-bold tracking-tight text-brand-navy sm:text-2xl">
                        {tName(cat.translations)}
                      </h3>
                      {!ro ? (
                        <button
                          type="button"
                          onClick={() => startEditingCategory(cat)}
                          className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-blue"
                          title={d.menuEditor.renameCategory}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {d.catalogEntry.count(cat.items.length)}
                  </p>
                </div>
                {!ro ? (
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat)}
                    disabled={cat.items.length > 0}
                    className={cn(
                      "shrink-0 transition",
                      cat.items.length > 0
                        ? "cursor-not-allowed rounded-lg p-2 text-slate-300"
                        : dashboardIconButtonClass("danger"),
                    )}
                    title={
                      cat.items.length > 0
                        ? d.catalogEntry.categoryDeleteHint
                        : d.menuEditor.deleteEmptyCategory
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {cat.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                    {d.catalogEntry.empty}
                  </p>
                ) : (
                  cat.items.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const extrasCount = parseItemExtras(item.extras).length;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl border bg-white transition-shadow",
                          isEditing
                            ? "border-brand-blue/30 shadow-md ring-2 ring-brand-blue/10"
                            : "border-slate-200/80 shadow-sm hover:border-slate-300/80",
                        )}
                      >
                        <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                          {item.photoUrl && !isEditing ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={panelPhotoDisplayUrl(item.photoUrl) ?? item.photoUrl}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover sm:h-14 sm:w-14"
                            />
                          ) : !isEditing ? (
                            <MenuItemPhotoPlaceholder size="sm" />
                          ) : null}

                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  value={editNameGr}
                                  onChange={(e) => setEditNameGr(e.target.value)}
                                  placeholder={FORM_PLACEHOLDERS.itemNameGr}
                                  className="min-w-[8rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                                    placeholder={FORM_PLACEHOLDERS.itemPrice}
                                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                            ) : (
                              <>
                                <div className="flex min-w-0 items-center gap-2">
                                  <p
                                    className={cn(
                                      "truncate text-base font-semibold sm:text-[1.05rem]",
                                      item.available ? "text-brand-navy" : "text-slate-400 line-through",
                                    )}
                                  >
                                    {tName(item.translations)}
                                  </p>
                                  {isItemLabel(item.label) ? (
                                    <ItemLabelBadge
                                      label={item.label}
                                      lang="GR"
                                      className="shrink-0"
                                    />
                                  ) : null}
                                  {!ro ? (
                                    <button
                                      type="button"
                                      onClick={() => startEditingItem(item)}
                                      className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-blue"
                                      title={d.catalogEntry.editTitle}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                  {ro ? (
                                    <span className="text-sm font-semibold tabular-nums text-brand-blue">
                                      €{item.price.toString()}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startEditingItem(item)}
                                      className="text-sm font-semibold tabular-nums text-brand-blue hover:underline"
                                      title={d.menuEditor.editPrice}
                                    >
                                      €{item.price.toString()}
                                    </button>
                                  )}
                                  {extrasCount > 0 ? (
                                    <span className="text-xs text-slate-500">{d.menuEditor.qrExtrasCount(extrasCount)}</span>
                                  ) : null}
                                </div>
                                {tGrField(item, "description") ? (
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                    {tGrField(item, "description")}
                                  </p>
                                ) : null}
                              </>
                            )}
                          </div>

                          {!isEditing && !ro ? (
                            <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                              <select
                                value={item.label ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  void setItemLabel(item.id, v ? (v as ItemLabel) : null);
                                }}
                                className="max-w-[8.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-brand-navy"
                                title={d.menuEditor.qrBadge}
                              >
                                <option value="">{d.menuEditor.noBadge}</option>
                                {ITEM_LABEL_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.dashboardGr}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => toggleItem(item)}
                                className={cn(
                                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                                  item.available
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {item.available ? d.menuEditor.active : d.menuEditor.inactive}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className={dashboardIconButtonClass("danger")}
                                title={d.catalogEntry.deleteTitle}
                                aria-label={d.catalogEntry.deleteTitle}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 px-3 py-4 sm:px-4">
                            <MenuItemDetailFields value={editDetail} onChange={setEditDetail} />
                            <PhotoUploadField value={editPhotoUrl} onChange={setEditPhotoUrl} />
                            <div className="space-y-2 rounded-lg border border-slate-200/80 bg-white p-3">
                              <p className="text-xs font-semibold text-brand-navy">{d.menuEditor.qrExtrasTitle}</p>
                              <p className="text-[11px] leading-snug text-slate-500">{d.menuEditor.qrExtrasHint}</p>
                              {editExtras.map((ex, i) => (
                                <div key={ex.id} className="flex items-center gap-2">
                                  <input
                                    value={ex.labels.GR}
                                    onChange={(e) => {
                                      const next = [...editExtras];
                                      next[i] = { ...ex, labels: { ...ex.labels, GR: e.target.value } };
                                      setEditExtras(next);
                                    }}
                                    placeholder={FORM_PLACEHOLDERS.extraOption}
                                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                  />
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      ex.price != null && ex.price > 0
                                        ? String(ex.price).replace(".", ",")
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const next = [...editExtras];
                                      if (raw.trim() === "") {
                                        next[i] = { ...ex, price: undefined };
                                      } else {
                                        const parsed = parseMenuPrice(raw);
                                        next[i] = {
                                          ...ex,
                                          price: Number.isFinite(parsed) && parsed >= 0 ? parsed : ex.price,
                                        };
                                      }
                                      setEditExtras(next);
                                    }}
                                    placeholder={FORM_PLACEHOLDERS.extraPrice}
                                    className="w-[4.5rem] shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                    title={d.menuEditor.extraChargePlaceholder}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditExtras(editExtras.filter((_, j) => j !== i))}
                                    className={dashboardIconButtonClass("danger", "sm")}
                                    title={d.menuEditor.remove}
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
                                  {d.menuEditor.addExtraOption}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}

                {!ro && itemCategoryId === cat.id ? (
                  <form
                    onSubmit={addItem}
                    className="space-y-3 rounded-xl border border-brand-blue/20 bg-brand-surface p-4 sm:p-5"
                  >
                    <p className="text-sm font-semibold text-brand-navy">{d.catalogEntry.new}</p>
                    <p className="text-xs text-slate-500">
                      {d.menuEditor.autoTranslateHint}
                    </p>
                    <div className={dashboardFormGridClass}>
                      <input
                        required
                        placeholder={`${FORM_PLACEHOLDERS.itemNameGr} *`}
                        value={itemForm.nameGr}
                        onChange={(e) => setItemForm((f) => ({ ...f, nameGr: e.target.value }))}
                        className={dashboardInputClass}
                      />
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={`${FORM_PLACEHOLDERS.itemPrice} *`}
                        value={itemForm.price}
                        onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                        className={dashboardInputClass}
                      />
                      <div className="sm:col-span-2">
                        <MenuItemDetailFields
                          value={itemForm}
                          onChange={(next) => setItemForm((f) => ({ ...f, ...next }))}
                        />
                      </div>
                      <PhotoUploadField
                        value={itemForm.photoUrl}
                        onChange={(url) => setItemForm((f) => ({ ...f, photoUrl: url }))}
                        className="sm:col-span-2"
                      />
                      <label className="block sm:col-span-2">
                        <span className={dashboardLabelClass}>{d.menuEditor.qrBadge}</span>
                        <select
                          value={itemForm.label}
                          onChange={(e) =>
                            setItemForm((f) => ({ ...f, label: e.target.value as "" | ItemLabel }))
                          }
                          className={dashboardFieldClass}
                        >
                          <option value="">{d.menuEditor.noBadge}</option>
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
                        {addingItem ? d.menuEditor.saving : d.catalogEntry.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemCategoryId(null)}
                        className={buttonClass("secondary", "sm")}
                      >
                        {d.menuEditor.cancel}
                      </button>
                    </div>
                  </form>
                ) : !ro ? (
                  <button
                    type="button"
                    onClick={() => tryOpenAddItem(cat.id)}
                    disabled={atItemLimit}
                    className={cn(
                      "flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-3 text-sm font-semibold transition",
                      atItemLimit
                        ? "cursor-not-allowed border-slate-200 bg-slate-50/40 text-slate-400"
                        : "border-slate-300 bg-slate-50/60 text-slate-600 hover:border-brand-blue/40 hover:bg-brand-blue/5 hover:text-brand-blue",
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    {d.catalogEntry.add}
                  </button>
                ) : null}
              </div>
            </Card>
          ))}

          {activeMenu?.categories.length === 0 ? (
            <Card className="border-dashed">
              <p className="text-center text-sm text-slate-500">
                {d.menuEditor.emptyCategories}
              </p>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
