"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PassStationInput, TableTileState, VenueOperationsConfig, VenuePost, VenueSpotType } from "@menuos/shared";
import {
  DEFAULT_STATION_LABELS_EL,
  DEFAULT_STATION_LABELS_EN,
  DEFAULT_TABLE_STATE_LABELS_EL,
  applyZoneLabelOverrides,
  enabledVenuePosts,
  groupVenueSpotsByZone,
  isValidVenueSpotLabel,
  listVenuePosts,
  MAX_VENUE_POSTS,
  mergeTableStateLabels,
  newVenuePostId,
  PASS_STATION_INPUTS,
  postLabelLooksLikeFloorWaiter,
  quickChipsForPost,
  syncLegacyFromPosts,
  TABLE_TILE_STATES,
  tableLegendStates,
  zoneSourceHint,
  type SpotZoneGroup,
} from "@menuos/shared";
import { FlashMessages, resolveApiError, useFlashMessage, type FlashMessage } from "@/components/dashboard/flash-message";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import {
  DashboardSectionTitle,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { TableGridLegend } from "@/components/dashboard/table-grid-preview";
import {
  MessageChipList,
  type MessageChipListHandle,
} from "@/components/dashboard/post-messages-editor";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { confirmDestructive } from "@/lib/confirm-action";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { DashboardIconButton } from "@/components/dashboard/dashboard-action-button";
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpaceKind = "prefixed" | "main" | "sunbed" | "room";

type Venue = { id: string; name: string };

export type OpsConfigSection = "departments" | "chips" | "map" | "zones";

const ALL_OPS_SECTIONS: OpsConfigSection[] = ["departments", "chips", "map", "zones"];

export function useVenueOperationsConfig(venueId: string) {
  const [config, setConfig] = useState<VenueOperationsConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const loadGenerationRef = useRef(0);

  const reload = useCallback(async () => {
    if (!venueId) {
      setConfig(null);
      return;
    }
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/operations-config`, {
        credentials: "include",
      });
      const data = (await res.json()) as { config?: VenueOperationsConfig };
      if (generation !== loadGenerationRef.current) return;
      if (res.ok && data.config) setConfig(data.config);
      else setConfig(null);
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setConfig(null);
    void reload();
  }, [venueId, reload]);

  return { config, loading, reload, setConfig };
}

export function ChipEditor({
  chips,
  onChange,
  placeholder,
}: {
  chips: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function addChip() {
    const value = draft.trim();
    if (!value || chips.includes(value) || chips.length >= 12) return;
    onChange([...chips, value]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(chips.filter((c) => c !== chip))}
              className="text-slate-400 hover:text-red-600"
              aria-label={`Remove ${chip}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addChip();
            }
          }}
          placeholder={placeholder}
          maxLength={60}
          className={`${dashboardFieldClass} min-w-0 flex-1 text-sm`}
        />
        <button type="button" onClick={addChip} className={buttonClass("secondary", "sm")}>
          +
        </button>
      </div>
    </div>
  );
}

type PanelIntro = {
  title: string;
  description: string;
  hint?: string;
};

export function VenueOperationsConfigPanel({
  venues,
  initialVenueId,
  sections = ALL_OPS_SECTIONS,
  showHeader = true,
  intro,
  messagesByPost = false,
  hideVenuePicker = false,
}: {
  venues: Venue[];
  initialVenueId?: string;
  sections?: OpsConfigSection[];
  showHeader?: boolean;
  intro?: PanelIntro;
  /** Messages tab: one editor per post; Services = map labels for waiters. */
  messagesByPost?: boolean;
  hideVenuePicker?: boolean;
}) {
  const { d, lang } = useDashboardCopy();
  const O = d.pages.settings.operations;
  const M = d.pages.settings.messagesTab;
  const Z = d.pages.settings.spacesTab;
  const Posts = d.pages.settings.postsTab;
  const P = d.pages.settings.personnel.stationLabels;
  const show = (s: OpsConfigSection) => sections.includes(s);
  const spaceMode = sections.length === 1 && sections[0] === "zones";
  const postsOnlyMode = sections.length === 1 && sections[0] === "departments";
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const { spots: panelSpots, reload: reloadSpots } = useVenueSpots(venueId);
  const zoneGroups = useMemo(
    () => groupVenueSpotsByZone(panelSpots.map((s) => ({ type: s.type, label: s.label }))),
    [panelSpots],
  );
  const spotByKey = useMemo(() => {
    const map = new Map<string, (typeof panelSpots)[number]>();
    for (const spot of panelSpots) {
      map.set(`${spot.type}:${spot.label}`, spot);
    }
    return map;
  }, [panelSpots]);
  const { config, loading, reload, setConfig } = useVenueOperationsConfig(venueId);
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<FlashMessage | null>(null);
  const saveFeedbackRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<VenueOperationsConfig | null>(null);
  const [showAddSpace, setShowAddSpace] = useState(false);
  const [newSpaceKind, setNewSpaceKind] = useState<SpaceKind>("prefixed");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceFrom, setNewSpaceFrom] = useState("1");
  const [newSpaceTo, setNewSpaceTo] = useState("");
  const [zoneBusy, setZoneBusy] = useState<string | null>(null);
  const messageListRefs = useRef<Map<string, MessageChipListHandle>>(new Map());

  function applyFlushedMessageDrafts(base: VenueOperationsConfig): VenueOperationsConfig {
    const chipsMap = { ...(base.quickChips ?? {}) };
    let changed = false;

    messageListRefs.current.forEach((handle, postId) => {
      const chips = handle.flushPending();
      const previous = base.quickChips?.[postId];
      if (chips.length === 0 && previous === undefined) return;
      if (
        (previous ?? []).length === chips.length &&
        (previous ?? []).every((item, index) => item === chips[index])
      ) {
        return;
      }
      if (chips.length === 0) delete chipsMap[postId];
      else chipsMap[postId] = chips;
      changed = true;
    });

    if (!changed) return base;
    return {
      ...base,
      quickChips: Object.keys(chipsMap).length ? chipsMap : undefined,
    };
  }

  function registerMessageListRef(postId: string, handle: MessageChipListHandle | null) {
    if (handle) messageListRefs.current.set(postId, handle);
    else messageListRefs.current.delete(postId);
  }

  useEffect(() => {
    if (initialVenueId) setVenueId(initialVenueId);
  }, [initialVenueId]);

  const langCode = lang === "EN" ? "EN" : "GR";

  useEffect(() => {
    if (config) setDraft(config);
    else setDraft(null);
  }, [config]);

  useEffect(() => {
    if (!saveFeedback) return;
    saveFeedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const timer = window.setTimeout(() => setSaveFeedback(null), 6000);
    return () => window.clearTimeout(timer);
  }, [saveFeedback]);

  const previewZones = useMemo(() => {
    if (!zoneGroups?.length || !draft) return zoneGroups ?? [];
    return applyZoneLabelOverrides(zoneGroups, draft.zoneLabels);
  }, [zoneGroups, draft]);

  if (venues.length === 0) return null;

  const stateLabelDefaults =
    lang === "EN" ? mergeTableStateLabels(undefined, "EN") : DEFAULT_TABLE_STATE_LABELS_EL;

  async function save() {
    if (!venueId || !draft) return;
    let draftToSave = applyFlushedMessageDrafts(draft);
    const hadJunkPost = draftToSave.posts?.some((post) => postLabelLooksLikeFloorWaiter(post.label)) ?? false;
    if (hadJunkPost && draftToSave.posts) {
      const removedIds = new Set(
        draftToSave.posts.filter((post) => postLabelLooksLikeFloorWaiter(post.label)).map((post) => post.id),
      );
      const filterPostMap = <T,>(map: Record<string, T> | undefined) => {
        if (!map) return undefined;
        const next = Object.fromEntries(Object.entries(map).filter(([id]) => !removedIds.has(id)));
        return Object.keys(next).length > 0 ? (next as Record<string, T>) : undefined;
      };
      draftToSave = {
        ...draftToSave,
        posts: draftToSave.posts.filter((post) => !postLabelLooksLikeFloorWaiter(post.label)),
        quickChips: filterPostMap(draftToSave.quickChips),
        postColors: filterPostMap(draftToSave.postColors),
      };
    }
    setDraft(draftToSave);
    const langCode = lang === "EN" ? "EN" : "GR";
    const posts = listVenuePosts(draftToSave, langCode);
    const payload = { ...draftToSave, ...syncLegacyFromPosts(posts), posts };
    setSaving(true);
    setSaveFeedback(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/operations-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.config) {
          setConfig(data.config);
          setDraft(data.config);
        }
        const successText = postsOnlyMode
          ? hadJunkPost
            ? `${Posts.savedNextSteps} ${Posts.junkRemovedHint}`
            : Posts.savedNextSteps
          : typeof data.message === "string"
            ? data.message
            : O.saved;
        setSaveFeedback({
          type: "success",
          text: successText,
        });
        setFlash(null);
      } else {
        showFromResponse(data, false, res.status);
        setSaveFeedback({ type: "error", text: resolveApiError(data, d.flash) });
      }
    } finally {
      setSaving(false);
    }
  }

  function updatePosts(nextPosts: VenuePost[]) {
    if (!draft) return;
    const legacy = syncLegacyFromPosts(nextPosts);
    setDraft({ ...draft, ...legacy, posts: nextPosts });
  }

  function togglePost(postId: string) {
    if (!draft) return;
    const posts = listVenuePosts(draft, lang === "EN" ? "EN" : "GR");
    const target = posts.find((post) => post.id === postId);
    if (!target) return;
    const enabledCount = posts.filter((post) => post.enabled).length;
    if (target.enabled && enabledCount <= 1) return;
    updatePosts(
      posts.map((post) => (post.id === postId ? { ...post, enabled: !post.enabled } : post)),
    );
  }

  function setPostLabel(postId: string, value: string) {
    if (!draft) return;
    const posts = listVenuePosts(draft, lang === "EN" ? "EN" : "GR");
    updatePosts(posts.map((post) => (post.id === postId ? { ...post, label: value } : post)));
  }

  function setPostStation(postId: string, station: PassStationInput) {
    if (!draft) return;
    const posts = listVenuePosts(draft, lang === "EN" ? "EN" : "GR");
    updatePosts(posts.map((post) => (post.id === postId ? { ...post, station } : post)));
  }

  function removePost(postId: string) {
    if (!draft) return;
    const posts = listVenuePosts(draft, lang === "EN" ? "EN" : "GR");
    if (posts.length <= 1) return;
    const removed = posts.find((post) => post.id === postId);
    const remaining = posts.filter((post) => post.id !== postId);
    const nextChips = { ...(draft.quickChips ?? {}) };
    delete nextChips[postId];
    if (removed && !remaining.some((post) => post.enabled && post.station === removed.station)) {
      delete nextChips[removed.station];
    }
    const nextColors = { ...(draft.postColors ?? {}) };
    delete nextColors[postId];
    const legacy = syncLegacyFromPosts(posts.filter((post) => post.id !== postId));
    setDraft({
      ...draft,
      ...legacy,
      posts: posts.filter((post) => post.id !== postId),
      quickChips: Object.keys(nextChips).length ? nextChips : undefined,
      postColors: Object.keys(nextColors).length ? nextColors : undefined,
    });
  }

  async function confirmRemovePost(postId: string) {
    if (!draft) return;
    const posts = listVenuePosts(draft, langCode);
    const post = posts.find((row) => row.id === postId);
    if (!post || posts.length <= 1) return;
    if (!(await confirmDestructive(O.removePostConfirm(post.label.trim())))) return;
    removePost(postId);
  }

  function addPost() {
    if (!draft) return;
    const posts = listVenuePosts(draft, lang === "EN" ? "EN" : "GR");
    if (posts.length >= MAX_VENUE_POSTS) return;
    const fallback = lang === "EN" ? "New post" : "Νέο πόστο";
    updatePosts([
      { id: newVenuePostId(), label: fallback, enabled: true, station: "kitchen" },
      ...posts,
    ]);
  }

  function setQuickChips(postId: string, chips: string[]) {
    if (!draft) return;
    setDraft({
      ...draft,
      quickChips: { ...(draft.quickChips ?? {}), [postId]: chips },
    });
  }

  function resetQuickChips(post: VenuePost) {
    if (!draft) return;
    const next = { ...(draft.quickChips ?? {}) };
    delete next[post.id];
    const sameStation = listVenuePosts(draft, langCode).filter(
      (row) => row.enabled && row.station === post.station,
    );
    if (sameStation.length === 1 && sameStation[0]?.id === post.id) {
      delete next[post.station];
    }
    setDraft({ ...draft, quickChips: Object.keys(next).length ? next : undefined });
  }

  function setTableStateLabel(state: TableTileState, value: string) {
    if (!draft) return;
    const merged = mergeTableStateLabels(draft, langCode);
    const trimmed = value.trim();
    const next = { ...(draft.tableStateLabels ?? {}) };
    if (!trimmed || trimmed === merged[state]) {
      delete next[state];
    } else {
      next[state] = trimmed;
    }
    setDraft({
      ...draft,
      tableStateLabels: Object.keys(next).length ? next : undefined,
    });
  }

  function setZoneLabel(zoneId: string, value: string) {
    if (!draft) return;
    const trimmed = value.trim();
    const autoLabel = zoneGroups?.find((z) => z.id === zoneId)?.label ?? zoneId;
    const next = { ...(draft.zoneLabels ?? {}) };
    if (!trimmed || trimmed === autoLabel) {
      delete next[zoneId];
    } else {
      next[zoneId] = trimmed;
    }
    setDraft({
      ...draft,
      zoneLabels: Object.keys(next).length ? next : undefined,
    });
  }

  function zoneDisplayName(zone: SpotZoneGroup): string {
    return draft?.zoneLabels?.[zone.id]?.trim() || zone.label;
  }

  async function createSpace(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;

    const from = Number(newSpaceFrom);
    const to = Number(newSpaceTo.trim() || newSpaceFrom);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from || from < 1 || to > 999) {
      setFlash({ type: "error", text: Z.invalidRange });
      return;
    }
    if (to - from >= 200) {
      setFlash({ type: "error", text: d.pages.qr.bulkLimit });
      return;
    }

    let spotType: VenueSpotType = "TABLE";
    let prefix = "";
    let displayName = newSpaceName.trim();

    if (newSpaceKind === "prefixed") {
      if (!displayName) {
        setFlash({ type: "error", text: Z.spaceNameRequired });
        return;
      }
      prefix = `${displayName}-`;
      if (!isValidVenueSpotLabel(`${prefix}${from}`)) {
        setFlash({ type: "error", text: d.pages.qr.labelHint });
        return;
      }
    } else if (newSpaceKind === "main") {
      displayName =
        draft?.zoneLabels?.main ??
        zoneGroups.find((z) => z.id === "main")?.label ??
        (lang === "EN" ? "Tables" : "Τραπέζια");
      if (!isValidVenueSpotLabel(String(from))) {
        setFlash({ type: "error", text: d.pages.qr.labelHint });
        return;
      }
    } else if (newSpaceKind === "sunbed") {
      spotType = "SUNBED";
      displayName =
        draft?.zoneLabels?.sunbed ??
        zoneGroups.find((z) => z.id === "sunbed")?.label ??
        (lang === "EN" ? "Sunbeds" : "Ξαπλώστρες");
    } else {
      spotType = "ROOM";
      displayName =
        draft?.zoneLabels?.room ??
        zoneGroups.find((z) => z.id === "room")?.label ??
        (lang === "EN" ? "Rooms" : "Δωμάτια");
    }

    setZoneBusy("create");
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: spotType, from, to, prefix }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFromResponse(data, false, res.status);
        return;
      }
      const count = to - from + 1;
      setFlash({ type: "success", text: Z.spaceCreated(displayName, count) });
      setNewSpaceName("");
      setNewSpaceFrom("1");
      setNewSpaceTo("");
      setShowAddSpace(false);
      await reloadSpots();
    } finally {
      setZoneBusy(null);
    }
  }

  async function deleteZone(zone: SpotZoneGroup) {
    if (!venueId || zone.spots.length === 0) return;
    const name = zoneDisplayName(zone);
    if (!(await confirmDestructive(Z.deleteSpaceConfirm(name, zone.spots.length)))) return;

    const ids = zone.spots
      .map((entry) => spotByKey.get(`${entry.spot.type}:${entry.spot.label}`)?.id)
      .filter((id): id is string => Boolean(id));

    setZoneBusy(`delete-${zone.id}`);
    try {
      for (const id of ids) {
        const res = await fetch(`/api/venues/${venueId}/spots/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          showFromResponse(data, false, res.status);
          return;
        }
      }

      if (draft?.zoneLabels?.[zone.id]) {
        const next = { ...(draft.zoneLabels ?? {}) };
        delete next[zone.id];
        const nextDraft = {
          ...draft,
          zoneLabels: Object.keys(next).length ? next : undefined,
        };
        setDraft(nextDraft);
        const langCode = lang === "EN" ? "EN" : "GR";
        const posts = listVenuePosts(nextDraft, langCode);
        await fetch(`/api/venues/${venueId}/operations-config`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...nextDraft, ...syncLegacyFromPosts(posts), posts }),
        });
      }

      setFlash({ type: "success", text: Z.spaceDeleted(name) });
      await reloadSpots();
      await reload();
    } finally {
      setZoneBusy(null);
    }
  }

  const previewLabels = draft
    ? mergeTableStateLabels(draft, lang === "EN" ? "EN" : "GR")
    : stateLabelDefaults;

  const draftPosts = draft ? listVenuePosts(draft, langCode) : [];
  const enabledPosts = draft ? enabledVenuePosts(draft, langCode) : [];

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={dashboardCardClass}>
        {intro ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-brand-navy">{intro.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{intro.description}</p>
              {intro.hint ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{intro.hint}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
              <button
                type="button"
                onClick={addPost}
                disabled={!draft || draftPosts.length >= MAX_VENUE_POSTS}
                className={buttonClass("secondary", "sm")}
              >
                <Plus className="mr-1.5 inline h-4 w-4" aria-hidden />
                {O.addPost}
              </button>
              {draft && draftPosts.length >= MAX_VENUE_POSTS ? (
                <p className="text-xs text-slate-500">{O.postsMaxReached}</p>
              ) : null}
            </div>
          </div>
        ) : showHeader ? (
          <DashboardSectionTitle title={O.title} description={O.description} />
        ) : null}

        {!hideVenuePicker && venues.length > 1 ? (
          <label className={intro || showHeader ? "mt-4 block max-w-md" : "block max-w-md"}>
            <span className={dashboardLabelClass}>{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className={dashboardFieldClass}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {loading || !draft ? (
          <p className="mt-4 text-sm text-slate-500">{O.loading}</p>
        ) : (
          <div className={intro || showHeader ? "mt-6 space-y-8" : "mt-4 space-y-8"}>
            {show("departments") ? (
            <section>
              {!intro ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-navy">{O.departmentsTitle}</h3>
                    <p className="mt-1 max-w-xl text-sm text-slate-600">{O.departmentsHint}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
                    <button
                      type="button"
                      onClick={addPost}
                      disabled={draftPosts.length >= MAX_VENUE_POSTS}
                      className={buttonClass("secondary", "sm")}
                    >
                      <Plus className="mr-1.5 inline h-4 w-4" aria-hidden />
                      {O.addPost}
                    </button>
                    {draftPosts.length >= MAX_VENUE_POSTS ? (
                      <p className="text-xs text-slate-500">{O.postsMaxReached}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className={`${intro ? "mt-5" : "mt-4"} overflow-x-auto rounded-xl border border-slate-200`}>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="w-16 px-4 py-3 text-center">{O.postActiveLabel}</th>
                      <th className="min-w-[14rem] px-4 py-3">{O.postNameLabel}</th>
                      <th className="w-44 px-4 py-3">{O.postTypeLabel}</th>
                      <th className="w-24 px-4 py-3 text-right">{O.postActionsLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftPosts.map((post) => {
                      const typeLabels =
                        lang === "EN" ? DEFAULT_STATION_LABELS_EN : DEFAULT_STATION_LABELS_EL;
                      return (
                        <tr
                          key={post.id}
                          className={`border-b border-slate-50 last:border-0 ${
                            post.enabled ? "bg-brand-blue/[0.03]" : "bg-slate-50/40 opacity-80"
                          }`}
                        >
                          <td className="px-4 py-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={post.enabled}
                              onChange={() => togglePost(post.id)}
                              className="h-4 w-4 accent-brand-blue"
                              aria-label={O.postActiveLabel}
                            />
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <input
                              value={post.label}
                              onChange={(e) => setPostLabel(post.id, e.target.value)}
                              maxLength={40}
                              placeholder={
                                postsOnlyMode ? Posts.postNamePlaceholder : P.kitchen
                              }
                              className={`${dashboardFieldClass} w-full min-w-[12rem] py-2.5 text-sm`}
                            />
                            {postsOnlyMode && postLabelLooksLikeFloorWaiter(post.label) ? (
                              <p className="mt-1.5 text-xs leading-snug text-amber-700">
                                {Posts.waiterNameWarning}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <select
                              value={post.station}
                              onChange={(e) =>
                                setPostStation(post.id, e.target.value as PassStationInput)
                              }
                              className={`${dashboardFieldClass} w-full min-w-[9rem] py-2.5 text-sm`}
                              title={postsOnlyMode ? Posts.postTypeHint : O.postTypeHint}
                            >
                              {PASS_STATION_INPUTS.map((station) => (
                                <option key={station} value={station}>
                                  {typeLabels[station]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right align-middle">
                            <div className="flex justify-end">
                              <DashboardIconButton
                                variant="danger"
                                disabled={draftPosts.length <= 1}
                                onClick={() => void confirmRemovePost(post.id)}
                                label={O.removePost}
                              >
                                <Trash2 className="h-4 w-4" />
                              </DashboardIconButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                {postsOnlyMode ? Posts.postTypeHint : O.postTypeHint}
              </p>
              {postsOnlyMode && enabledPosts.length > 0 ? (
                <div className="mt-5 rounded-xl border border-brand-blue/20 bg-brand-blue/[0.04] p-4 sm:p-5">
                  <p className="text-sm font-semibold text-brand-navy">{Posts.linkedTitle}</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {enabledPosts.map((post) => {
                      const stationLabels =
                        lang === "EN" ? DEFAULT_STATION_LABELS_EN : DEFAULT_STATION_LABELS_EL;
                      return (
                        <li key={post.id} className="flex flex-wrap items-baseline gap-x-1">
                          <span>
                            {Posts.linkedTablet(post.label.trim(), stationLabels[post.station])}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{Posts.linkedWaiterNote}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/settings?tab=messages"
                      className={`inline-flex items-center ${buttonClass("secondary", "sm")}`}
                    >
                      {Posts.nextMessagesLink}
                    </Link>
                    <Link
                      href="/dashboard/settings?tab=staff"
                      className={`inline-flex items-center ${buttonClass("secondary", "sm")}`}
                    >
                      {Posts.nextStaffLink}
                    </Link>
                  </div>
                </div>
              ) : null}
            </section>
            ) : null}

            {show("chips") && messagesByPost ? (
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-navy">{M.byPostTitle}</h3>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">{M.byPostHint}</p>
              </div>

              {enabledPosts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {M.noPostsHint}{" "}
                  <Link href="/dashboard/settings?tab=posts" className="font-semibold text-brand-blue hover:underline">
                    {M.managePostsLink}
                  </Link>
                </p>
              ) : draft ? (
                <div className="space-y-4">
                  {enabledPosts.map((post) => {
                    const items = draft.quickChips?.[post.id] ?? [];
                    const hasCustom = items.length > 0;
                    const stationLabels =
                      lang === "EN" ? DEFAULT_STATION_LABELS_EN : DEFAULT_STATION_LABELS_EL;
                    return (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-semibold text-brand-navy">{post.label.trim()}</h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {stationLabels[post.station]}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                                hasCustom
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {M.messageCount(items.length)}
                            </span>
                            {hasCustom ? (
                              <button
                                type="button"
                                onClick={() => resetQuickChips(post)}
                                className="text-xs font-medium text-slate-500 hover:text-brand-blue"
                              >
                                {M.resetPostMessages}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <MessageChipList
                          ref={(handle) => registerMessageListRef(post.id, handle)}
                          items={items}
                          onChange={(next) => setQuickChips(post.id, next)}
                          placeholder={M.messagePlaceholder}
                          addLabel={M.addMessage}
                        />
                        {!hasCustom ? (
                          <p className="mt-2 text-sm text-slate-500">{M.previewEmpty}</p>
                        ) : null}
                        <p className="mt-3 text-xs leading-relaxed text-slate-500">
                          {M.passTabletStaffHint(post.label.trim())}{" "}
                          <Link
                            href="/dashboard/settings?tab=staff"
                            className="font-semibold text-brand-blue hover:underline"
                          >
                            {M.assignInStaffLink}
                          </Link>
                        </p>
                      </div>
                    );
                  })}
                  <p className="text-xs leading-relaxed text-slate-500">{M.messageSaveHint}</p>
                </div>
              ) : null}
            </section>
            ) : show("chips") ? (
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">{O.quickChipsTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">{O.quickChipsHint}</p>
              <div className="mt-4 space-y-5">
                {enabledPosts.map((post) => {
                  const chips =
                    draft.quickChips?.[post.id] ??
                    quickChipsForPost(draft, post.id, langCode);
                  return (
                    <div
                      key={post.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
                          {post.label.trim()}
                        </p>
                        <button
                          type="button"
                          onClick={() => resetQuickChips(post)}
                          className="text-xs font-medium text-slate-500 hover:text-brand-blue"
                        >
                          {O.resetDefaults}
                        </button>
                      </div>
                      <ChipEditor
                        chips={chips}
                        onChange={(next) => setQuickChips(post.id, next)}
                        placeholder={O.chipPlaceholder}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
            ) : null}

            {show("map") && !messagesByPost ? (
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">{O.mapLabelsTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">{O.mapLabelsHint}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {TABLE_TILE_STATES.map((state) => (
                  <label key={state} className="block">
                    <span className="text-xs font-medium text-slate-500">
                      {stateLabelDefaults[state]}
                    </span>
                    <input
                      value={draft.tableStateLabels?.[state] ?? stateLabelDefaults[state]}
                      onChange={(e) => setTableStateLabel(state, e.target.value)}
                      maxLength={40}
                      className={`${dashboardFieldClass} mt-1 text-sm`}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <TableGridLegend
                  stateLabels={previewLabels}
                  states={draft ? tableLegendStates(draft) : undefined}
                />
              </div>
            </section>
            ) : null}

            {show("zones") && spaceMode ? (
              <section>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-navy">{O.zonesTitle}</h3>
                    <p className="mt-1 text-sm text-slate-600">{O.zonesHint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddSpace((open) => !open)}
                    className={buttonClass("secondary", "sm")}
                  >
                    <Plus className="mr-1.5 inline h-4 w-4" aria-hidden />
                    {Z.addSpace}
                  </button>
                </div>

                {showAddSpace ? (
                  <form
                    onSubmit={(e) => void createSpace(e)}
                    className="mt-4 space-y-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-brand-navy">{Z.addSpaceTitle}</p>
                      <p className="mt-1 text-sm text-slate-600">{Z.addSpaceDesc}</p>
                    </div>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
                      <label className="block min-w-[min(100%,11rem)] flex-1 basis-44">
                        <span className={dashboardLabelClass}>{Z.spaceKindLabel}</span>
                        <select
                          value={newSpaceKind}
                          onChange={(e) => setNewSpaceKind(e.target.value as SpaceKind)}
                          className={dashboardFieldClass}
                        >
                          <option value="prefixed">{Z.spaceKindPrefixed}</option>
                          <option value="main">{Z.spaceKindMain}</option>
                          <option value="sunbed">{Z.spaceKindSunbed}</option>
                          <option value="room">{Z.spaceKindRoom}</option>
                        </select>
                      </label>
                      {newSpaceKind === "prefixed" ? (
                        <label className="block min-w-[min(100%,9rem)] flex-[1.5] basis-36">
                          <span className={dashboardLabelClass}>{Z.spaceNameLabel}</span>
                          <input
                            value={newSpaceName}
                            onChange={(e) => setNewSpaceName(e.target.value)}
                            placeholder={FORM_PLACEHOLDERS.spotSpaceName}
                            maxLength={15}
                            className={dashboardFieldClass}
                          />
                        </label>
                      ) : null}
                      <label className="block w-[4.25rem] shrink-0">
                        <span className={dashboardLabelClass}>{Z.fromLabel}</span>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={newSpaceFrom}
                          onChange={(e) => setNewSpaceFrom(e.target.value)}
                          className={`${dashboardFieldClass} w-full px-1.5 text-center tabular-nums`}
                        />
                      </label>
                      <label className="block w-[4.25rem] shrink-0">
                        <span className={dashboardLabelClass}>{Z.toLabel}</span>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={newSpaceTo}
                          onChange={(e) => setNewSpaceTo(e.target.value)}
                          placeholder={FORM_PLACEHOLDERS.spotBulkTo}
                          className={`${dashboardFieldClass} w-full px-1.5 text-center tabular-nums`}
                        />
                      </label>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={zoneBusy !== null}
                          className={buttonClass("primary", "sm")}
                        >
                          {zoneBusy === "create" ? Z.creatingSpace : Z.createSpace}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddSpace(false)}
                          className={buttonClass("secondary", "sm")}
                        >
                          {d.pages.settings.personnel.cancelEdit}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : null}

                {previewZones && previewZones.length > 0 ? (
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <h4 className="text-center text-sm font-semibold text-brand-navy">
                      {Z.previewTitle}
                    </h4>
                    <p className="mt-1 text-center text-xs text-slate-500">{Z.previewHint}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {previewZones.map((zone) => (
                        <div
                          key={zone.id}
                          className="flex min-h-[4.5rem] w-[calc(50%-0.25rem)] max-w-[9.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-3 py-3 text-center sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5rem)]"
                        >
                          <span className="text-sm font-bold leading-tight text-brand-navy sm:text-base">
                            {zone.label}
                          </span>
                          <span className="text-2xl font-extrabold tabular-nums leading-none text-amber-700">
                            {zone.spots.length}
                          </span>
                          <span className="text-[10px] text-slate-400 sm:text-xs">
                            {Z.spotCount(zone.spots.length)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {zoneGroups && zoneGroups.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2.5">{O.zonesSourceLabel}</th>
                          <th className="px-3 py-2.5">{O.zonesNameLabel}</th>
                          <th className="px-3 py-2.5 text-center">{O.zonesCountLabel}</th>
                          <th className="px-3 py-2.5 text-center">
                            <span className="sr-only">{O.removePost}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {zoneGroups.map((zone) => (
                          <tr key={zone.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2.5 align-middle text-xs text-slate-500">
                              {zoneSourceHint(zone, langCode)}
                            </td>
                            <td className="px-3 py-2.5 align-middle">
                              <input
                                value={draft.zoneLabels?.[zone.id] ?? zone.label}
                                onChange={(e) => setZoneLabel(zone.id, e.target.value)}
                                maxLength={40}
                                className={`${dashboardFieldClass} w-full min-w-[8rem] text-center text-sm`}
                              />
                            </td>
                            <td className="px-3 py-2.5 align-middle text-center tabular-nums text-slate-600">
                              {zone.spots.length}
                            </td>
                            <td className="px-3 py-2.5 align-middle text-center">
                              <button
                                type="button"
                                onClick={() => void deleteZone(zone)}
                                disabled={zoneBusy !== null || zone.spots.length === 0}
                                className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
                                aria-label={Z.deleteSpace}
                                title={Z.deleteSpace}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">{Z.empty}</p>
                )}
              </section>
            ) : show("zones") && zoneGroups && zoneGroups.length > 0 ? (
              <section>
                <h3 className="text-sm font-semibold text-brand-navy">{O.zonesTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{O.zonesHint}</p>

                {previewZones && previewZones.length > 0 ? (
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <h4 className="text-center text-sm font-semibold text-brand-navy">
                      {O.zonesPreviewTitle}
                    </h4>
                    <p className="mt-1 text-center text-xs text-slate-500">{O.zonesPreviewHint}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {previewZones.map((zone) => (
                        <div
                          key={zone.id}
                          className="flex min-h-[4.5rem] w-[calc(50%-0.25rem)] max-w-[9.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-3 py-3 text-center sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5rem)]"
                        >
                          <span className="text-sm font-bold leading-tight text-brand-navy sm:text-base">
                            {zone.label}
                          </span>
                          <span className="text-2xl font-extrabold tabular-nums leading-none text-amber-700">
                            {zone.spots.length}
                          </span>
                          <span className="text-[10px] text-slate-400 sm:text-xs">
                            {Z.spotCount(zone.spots.length)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2.5">{O.zonesSourceLabel}</th>
                        <th className="px-3 py-2.5">{O.zonesNameLabel}</th>
                        <th className="px-3 py-2.5 text-center">{O.zonesCountLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneGroups.map((zone) => (
                        <tr key={zone.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-3 py-2.5 align-middle text-xs text-slate-500">
                            {zoneSourceHint(zone, langCode)}
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <input
                              value={draft.zoneLabels?.[zone.id] ?? zone.label}
                              onChange={(e) => setZoneLabel(zone.id, e.target.value)}
                              maxLength={40}
                              className={`${dashboardFieldClass} w-full min-w-[8rem] text-center text-sm`}
                            />
                          </td>
                          <td className="px-3 py-2.5 align-middle text-center tabular-nums text-slate-600">
                            {zone.spots.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : show("zones") ? (
              <section>
                <h3 className="text-sm font-semibold text-brand-navy">{O.zonesTitle}</h3>
                <p className="mt-4 text-sm text-slate-600">{Z.empty}</p>
              </section>
            ) : null}

            <div
              className={`space-y-4 border-t border-slate-100 pt-5 ${
                postsOnlyMode ? "" : ""
              }`}
            >
              {saveFeedback ? (
                <div
                  ref={saveFeedbackRef}
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-4 text-sm shadow-soft",
                    saveFeedback.type === "success" &&
                      "border-emerald-300 bg-emerald-50 text-emerald-950",
                    saveFeedback.type === "error" && "border-red-200 bg-red-50 text-red-900",
                  )}
                >
                  {saveFeedback.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-base font-semibold leading-snug">{saveFeedback.text}</p>
                    {postsOnlyMode && saveFeedback.type === "success" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href="/dashboard/settings?tab=messages"
                          className="text-sm font-semibold text-emerald-800 underline hover:text-emerald-950"
                        >
                          {Posts.nextMessagesLink}
                        </Link>
                        <Link
                          href="/dashboard/settings?tab=staff"
                          className="text-sm font-semibold text-emerald-800 underline hover:text-emerald-950"
                        >
                          {Posts.nextStaffLink}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className={`flex flex-wrap gap-3 ${postsOnlyMode ? "justify-end" : ""}`}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className={cn(
                    buttonClass("primary"),
                    saveFeedback?.type === "success" &&
                      !saving &&
                      "ring-2 ring-emerald-400 ring-offset-2",
                  )}
                >
                  {saving ? O.saving : O.save}
                </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void reload()}
                className={buttonClass("secondary")}
              >
                {O.reload}
              </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
