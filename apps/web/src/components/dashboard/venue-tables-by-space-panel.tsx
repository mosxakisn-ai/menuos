"use client";

import Link from "next/link";
import {
  Check,
  ChevronDown,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyZoneLabelOverrides,
  formatVenueSpotLabelForLang,
  groupVenueSpotsByZone,
  isValidVenueSpotLabel,
  listVenuePosts,
  syncLegacyFromPosts,
  zoneSourceHint,
  type SpotZoneGroup,
  type VenueSpotType,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import {
  useVenueOperationsConfig,
} from "@/components/dashboard/venue-operations-config-panel";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { DashboardIconButton } from "@/components/dashboard/dashboard-action-button";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { confirmDestructive } from "@/lib/confirm-action";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

type Venue = { id: string; name: string; slug: string };
type SpaceKind = "prefixed" | "main" | "sunbed" | "room";

function zoneCreateParams(
  kind: SpaceKind,
  spaceName: string,
  lang: "GR" | "EN",
): { type: VenueSpotType; prefix: string; displayName: string } {
  const name = spaceName.trim();
  if (kind === "sunbed") {
    return { type: "SUNBED", prefix: "", displayName: name || (lang === "EN" ? "Sunbeds" : "Ξαπλώστρες") };
  }
  if (kind === "room") {
    return { type: "ROOM", prefix: "", displayName: name || (lang === "EN" ? "Rooms" : "Δωμάτια") };
  }
  if (kind === "main") {
    return { type: "TABLE", prefix: "", displayName: name || (lang === "EN" ? "Tables" : "Τραπέζια") };
  }
  return { type: "TABLE", prefix: `${name}-`, displayName: name };
}

function zoneBulkParams(zone: SpotZoneGroup): { type: VenueSpotType; prefix: string } {
  if (zone.id === "sunbed") return { type: "SUNBED", prefix: "" };
  if (zone.id === "room") return { type: "ROOM", prefix: "" };
  if (zone.id === "main") return { type: "TABLE", prefix: "" };
  if (zone.id.startsWith("prefix:")) return { type: "TABLE", prefix: `${zone.label}-` };
  return { type: "TABLE", prefix: "" };
}

function SpaceAccordion({
  zone,
  displayName,
  langCode,
  spotByKey,
  expanded,
  onToggle,
  busy,
  onDeleteZone,
  onAddRange,
  onEditSpot,
  onDeleteSpot,
  copy,
}: {
  zone: SpotZoneGroup;
  displayName: string;
  langCode: "GR" | "EN";
  spotByKey: Map<string, { id: string; type: VenueSpotType; label: string }>;
  expanded: boolean;
  onToggle: () => void;
  busy: string | null;
  onDeleteZone: () => void;
  onAddRange: (from: number, to: number) => void;
  onEditSpot: (spotId: string, label: string) => Promise<void>;
  onDeleteSpot: (spotId: string, name: string) => void;
  copy: {
    spotCount: (n: number) => string;
    sourceHint: string;
    addMoreTitle: string;
    fromLabel: string;
    toLabel: string;
    addMore: string;
    adding: string;
    deleteSpace: string;
    editSpot: string;
    deleteSpot: string;
    emptyZone: string;
  };
}) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const zoneBusy = busy === `zone-${zone.id}-add` ? "add" : null;

  async function saveEdit(spotId: string) {
    await onEditSpot(spotId, editLabel);
    setEditingId(null);
    setEditLabel("");
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80 transition-shadow hover:shadow-md">
      <div className="flex items-stretch gap-0">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-gradient-to-r hover:from-brand-blue/[0.04] hover:to-cyan-400/[0.05]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/15 to-cyan-400/20 text-brand-blue">
            <MapPin className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-brand-navy">{displayName}</h3>
              <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-blue">
                {copy.spotCount(zone.spots.length)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">{copy.sourceHint}</p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <div className="flex shrink-0 items-center border-l border-slate-100 px-2">
          <DashboardIconButton
            variant="danger"
            disabled={Boolean(busy) || zone.spots.length === 0}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteZone();
            }}
            label={copy.deleteSpace}
          >
            <Trash2 className="h-4 w-4" />
          </DashboardIconButton>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4">
          {zone.spots.length === 0 ? (
            <p className="text-sm text-slate-500">{copy.emptyZone}</p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 bg-white p-3">
              <ul className="flex flex-wrap gap-2">
                {zone.spots.map((entry) => {
                  const spot = spotByKey.get(`${entry.spot.type}:${entry.spot.label}`);
                  if (!spot) return null;
                  const spotName = formatVenueSpotLabelForLang(spot.type, spot.label, langCode);

                  if (editingId === spot.id) {
                    return (
                      <li key={spot.id} className="flex w-full max-w-xs items-center gap-2">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          maxLength={20}
                          className={`${dashboardFieldClass} min-w-0 flex-1 text-sm`}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => void saveEdit(spot.id)}
                          className={buttonClass("primary", "sm")}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className={buttonClass("secondary", "sm")}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={spot.id}>
                      <div className="group inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-sm font-medium text-brand-navy">
                        <span>{entry.displayLabel || spotName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(spot.id);
                            setEditLabel(spot.label);
                          }}
                          className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-brand-blue group-hover:opacity-100"
                          title={copy.editSpot}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => onDeleteSpot(spot.id, spotName)}
                          className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                          title={copy.deleteSpot}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {copy.addMoreTitle}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block w-24">
                <span className={dashboardLabelClass}>{copy.fromLabel}</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={dashboardFieldClass}
                />
              </label>
              <label className="block w-24">
                <span className={dashboardLabelClass}>{copy.toLabel}</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.spotBulkTo}
                  className={dashboardFieldClass}
                />
              </label>
              <button
                type="button"
                disabled={Boolean(busy) || !to.trim()}
                onClick={() => {
                  const fromN = Number(from);
                  const toN = Number(to);
                  onAddRange(fromN, toN);
                }}
                className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
              >
                <Plus className="h-4 w-4" />
                {zoneBusy === "add" ? copy.adding : copy.addMore}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function VenueTablesBySpacePanel({
  venues,
  venueId: venueIdProp,
}: {
  venues: Venue[];
  venueId: string;
}) {
  const { d, lang } = useDashboardCopy();
  const T = d.pages.settings.tablesTab;
  const Z = d.pages.settings.spacesTab;
  const Q = d.pages.qr;
  const langCode = lang === "EN" ? "EN" : "GR";

  const { spots, loading, reload } = useVenueSpots(venueIdProp);
  const { config: opsConfig, loading: configLoading, reload: reloadConfig } = useVenueOperationsConfig(venueIdProp);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const [spaceKind, setSpaceKind] = useState<SpaceKind>("prefixed");
  const [spaceName, setSpaceName] = useState("");
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpanded({});
  }, [venueIdProp]);

  const venueId = venueIdProp;

  const zoneGroups = useMemo(() => {
    const groups = groupVenueSpotsByZone(spots);
    return applyZoneLabelOverrides(groups, opsConfig?.zoneLabels);
  }, [spots, opsConfig?.zoneLabels]);

  const spotByKey = useMemo(() => {
    const map = new Map<string, (typeof spots)[number]>();
    for (const spot of spots) {
      map.set(`${spot.type}:${spot.label}`, spot);
    }
    return map;
  }, [spots]);

  function zoneDisplayName(zone: SpotZoneGroup): string {
    return opsConfig?.zoneLabels?.[zone.id]?.trim() || zone.label;
  }

  function toggleZone(zoneId: string) {
    setExpanded((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }));
  }

  const validateRange = useCallback(
    (fromN: number, toN: number): boolean => {
      if (!Number.isFinite(fromN) || !Number.isFinite(toN) || toN < fromN || fromN < 1 || toN > 999) {
        setFlash({ type: "error", text: Q.invalidRange });
        return false;
      }
      if (toN - fromN >= 200) {
        setFlash({ type: "error", text: Q.bulkLimit });
        return false;
      }
      return true;
    },
    [Q.bulkLimit, Q.invalidRange, setFlash],
  );

  async function createSpace(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;

    const fromN = Number(from);
    const toN = Number(to.trim() || from);
    if (!validateRange(fromN, toN)) return;

    const { type, prefix, displayName } = zoneCreateParams(spaceKind, spaceName, langCode);
    if (spaceKind === "prefixed" && !spaceName.trim()) {
      setFlash({ type: "error", text: Z.spaceNameRequired });
      return;
    }

    const sampleLabel = prefix ? `${prefix}${fromN}` : String(fromN);
    if (!isValidVenueSpotLabel(sampleLabel)) {
      setFlash({ type: "error", text: Q.labelHint });
      return;
    }

    setBusy("create");
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, from: fromN, to: toN, prefix }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFromResponse(data, false, res.status);
        return;
      }
      const count = toN - fromN + 1;
      setFlash({ type: "success", text: Z.spaceCreated(displayName, count) });
      setSpaceName("");
      setFrom("1");
      setTo("");
      await reload();
      const newZoneId =
        spaceKind === "prefixed"
          ? `prefix:${spaceName.trim().toLowerCase()}`
          : spaceKind === "sunbed"
            ? "sunbed"
            : spaceKind === "room"
              ? "room"
              : "main";
      setExpanded((prev) => ({ ...prev, [newZoneId]: true }));
    } finally {
      setBusy(null);
    }
  }

  async function addRangeToZone(zone: SpotZoneGroup, fromN: number, toN: number) {
    if (!venueId || !validateRange(fromN, toN)) return;
    const { type, prefix } = zoneBulkParams(zone);
    const sampleLabel = prefix ? `${prefix}${fromN}` : String(fromN);
    if (!isValidVenueSpotLabel(sampleLabel)) {
      setFlash({ type: "error", text: Q.labelHint });
      return;
    }

    setBusy(`zone-${zone.id}-add`);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, from: fromN, to: toN, prefix }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setExpanded((prev) => ({ ...prev, [zone.id]: true }));
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteZone(zone: SpotZoneGroup) {
    if (!venueId || zone.spots.length === 0) return;
    const name = zoneDisplayName(zone);
    if (!(await confirmDestructive(Z.deleteSpaceConfirm(name, zone.spots.length)))) return;

    const ids = zone.spots
      .map((entry) => spotByKey.get(`${entry.spot.type}:${entry.spot.label}`)?.id)
      .filter((id): id is string => Boolean(id));

    setBusy(`zone-${zone.id}-delete`);
    try {
      for (const id of ids) {
        const res = await fetch(`/api/venues/${venueId}/spots/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          showFromResponse(data, false, res.status);
          return;
        }
      }

      if (opsConfig?.zoneLabels?.[zone.id]) {
        const next = { ...(opsConfig.zoneLabels ?? {}) };
        delete next[zone.id];
        const nextConfig = {
          ...opsConfig,
          zoneLabels: Object.keys(next).length ? next : undefined,
        };
        const posts = listVenuePosts(nextConfig, langCode);
        await fetch(`/api/venues/${venueId}/operations-config`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...nextConfig, ...syncLegacyFromPosts(posts), posts }),
        });
        await reloadConfig();
      }

      setFlash({ type: "success", text: Z.spaceDeleted(name) });
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[zone.id];
        return next;
      });
      await reload();
    } finally {
      setBusy(null);
    }
  }

  async function deleteSpot(spotId: string, name: string) {
    if (!venueId) return;
    if (!(await confirmDestructive(Q.deleteSpotConfirm(name)))) return;
    setBusy(`spot-${spotId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots/${spotId}`, { method: "DELETE" });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) await reload();
    } finally {
      setBusy(null);
    }
  }

  async function editSpot(spotId: string, label: string) {
    if (!venueId || !label.trim()) return;
    if (!isValidVenueSpotLabel(label)) {
      setFlash({ type: "error", text: Q.labelHint });
      return;
    }
    setBusy(`edit-${spotId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) await reload();
    } finally {
      setBusy(null);
    }
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="text-sm text-slate-600">{Q.needVenueDesc}</p>
      </div>
    );
  }

  const previewCount =
    spaceKind === "prefixed" && spaceName.trim() && to.trim()
      ? (() => {
          const fromN = Number(from);
          const toN = Number(to);
          if (Number.isFinite(fromN) && Number.isFinite(toN) && toN >= fromN) {
            return toN - fromN + 1;
          }
          return 0;
        })()
      : to.trim()
        ? (() => {
            const fromN = Number(from);
            const toN = Number(to);
            if (Number.isFinite(fromN) && Number.isFinite(toN) && toN >= fromN) {
              return toN - fromN + 1;
            }
            return 0;
          })()
        : 0;

  const accordionCopy = {
    spotCount: T.spotCount,
    sourceHint: "",
    addMoreTitle: T.addMoreTitle,
    fromLabel: Q.fromLabel,
    toLabel: Q.toLabel,
    addMore: T.addMore,
    adding: T.creating,
    deleteSpace: Z.deleteSpace,
    editSpot: Q.editSpot,
    deleteSpot: Q.deleteSpotLabel,
    emptyZone: T.emptyZone,
  };

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={`${dashboardCardClass} overflow-hidden`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-cyan-400 text-white shadow-sm">
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-brand-navy">{T.createTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{T.createDesc}</p>
          </div>
        </div>

        <form onSubmit={(e) => void createSpace(e)} className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["prefixed", Z.spaceKindPrefixed],
                ["main", Z.spaceKindMain],
                ["sunbed", Z.spaceKindSunbed],
                ["room", Z.spaceKindRoom],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setSpaceKind(kind)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  spaceKind === kind
                    ? "bg-brand-blue text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-brand-blue/30 hover:text-brand-blue"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_5rem_5rem_auto] lg:items-end">
            {spaceKind === "prefixed" ? (
              <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
                <span className={dashboardLabelClass}>{Z.spaceNameLabel}</span>
                <input
                  type="text"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.spotSpaceName}
                  maxLength={15}
                  className={dashboardFieldClass}
                />
              </label>
            ) : (
              <div className="hidden lg:block" aria-hidden />
            )}
            <label className="block">
              <span className={dashboardLabelClass}>{Z.fromLabel}</span>
              <input
                type="number"
                min={1}
                max={999}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={dashboardFieldClass}
              />
            </label>
            <label className="block">
              <span className={dashboardLabelClass}>{Z.toLabel}</span>
              <input
                type="number"
                min={1}
                max={999}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.spotBulkTo}
                className={dashboardFieldClass}
              />
            </label>
            <button
              type="submit"
              disabled={busy !== null || !to.trim() || (spaceKind === "prefixed" && !spaceName.trim())}
              className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap sm:col-span-2 lg:col-span-1 ${buttonClass("primary", "md")}`}
            >
              <Plus className="h-4 w-4" />
              {busy === "create" ? T.creating : T.createSpace}
            </button>
          </div>

          {previewCount > 0 && previewCount <= 200 ? (
            <p className="text-xs text-slate-500">
              {T.createPreview(
                spaceKind === "prefixed" ? spaceName.trim() : zoneCreateParams(spaceKind, "", langCode).displayName,
                Number(from),
                Number(to),
                previewCount,
              )}
            </p>
          ) : null}
        </form>
      </div>

      <div className={dashboardCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-brand-navy">{T.listTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{T.listDesc}</p>
          </div>
          {zoneGroups.length > 1 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  for (const z of zoneGroups) all[z.id] = true;
                  setExpanded(all);
                }}
                className={buttonClass("secondary", "sm")}
              >
                {T.expandAll}
              </button>
              <button
                type="button"
                onClick={() => setExpanded({})}
                className={buttonClass("secondary", "sm")}
              >
                {T.collapseAll}
              </button>
            </div>
          ) : null}
        </div>

        {loading || configLoading ? (
          <p className="mt-6 text-sm text-slate-500">{T.loading}</p>
        ) : zoneGroups.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <p className="text-sm text-slate-600">{T.empty}</p>
            <p className="mt-2 text-xs text-slate-500">{T.emptyHint}</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {zoneGroups.map((zone) => (
              <SpaceAccordion
                key={zone.id}
                zone={zone}
                displayName={zoneDisplayName(zone)}
                langCode={langCode}
                spotByKey={spotByKey}
                expanded={Boolean(expanded[zone.id])}
                onToggle={() => toggleZone(zone.id)}
                busy={busy}
                onDeleteZone={() => void deleteZone(zone)}
                onAddRange={(fromN, toN) => void addRangeToZone(zone, fromN, toN)}
                onEditSpot={editSpot}
                onDeleteSpot={(id, name) => void deleteSpot(id, name)}
                copy={{
                  ...accordionCopy,
                  sourceHint: zoneSourceHint(zone, langCode),
                }}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
