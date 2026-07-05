"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyZoneLabelOverrides,
  enabledVenuePosts,
  getPostMessageColor,
  groupVenueSpotsByZone,
  listVenuePosts,
  pickStationScreenForStaffAssignment,
  resolveStaffAssignmentToPassInput,
  staffAssignmentLinkKind,
  staffAssignmentLabelForLang,
  staffAssignmentsFromPrimary,
  staffPostPickerLabel,
  staffPostRequiresZoneAssignment,
  staffPostStationSubtitle,
  staffPrimaryAssignment,
  visibleMessagesForStaffAssignment,
  type PassStationInput,
  type VenueOperationsConfig,
  type VenuePost,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import {
  DashboardIconButton,
  dashboardTextActionClass,
} from "@/components/dashboard/dashboard-action-button";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import { confirmDestructive, confirmWarning } from "@/lib/confirm-action";
import { buildStaffShareUrl, buildStationScreenShareUrl } from "@/lib/staff-share-url";
import type { StaffScreensByStation } from "@/lib/staff-member-access-url";

type Venue = { id: string; name: string; slug: string };
type StaffMember = {
  id: string;
  name: string;
  roleLabel: string;
  zoneId: string | null;
  messageScope: string | null;
  stations: string[];
  memberToken: string;
};

const PASS_STATIONS: PassStationInput[] = ["kitchen", "bar", "cold", "dessert"];

type StaffAccessLink =
  | { kind: "waiter"; url: string }
  | { kind: "pass"; url: string; station: PassStationInput }
  | { kind: "missing-screen"; station: PassStationInput }
  | { kind: "invalid-assignment" };

function memberAccessLink(
  venueSlug: string,
  member: StaffMember,
  posts: VenuePost[],
  screensByStation: StaffScreensByStation,
): StaffAccessLink {
  const assignment = staffPrimaryAssignment(member.stations);
  const linkKind = staffAssignmentLinkKind(assignment, posts);
  if (linkKind === "invalid") return { kind: "invalid-assignment" };
  const station = resolveStaffAssignmentToPassInput(assignment, posts);
  if (station) {
    const screens = screensByStation[station] ?? [];
    const picked = pickStationScreenForStaffAssignment(assignment, posts, screens);
    if (picked) {
      return {
        kind: "pass",
        url: buildStationScreenShareUrl(picked.station, venueSlug, picked.screenToken),
        station: picked.station,
      };
    }
    return { kind: "missing-screen", station };
  }
  return {
    kind: "waiter",
    url: buildStaffShareUrl(venueSlug, member.memberToken, member.zoneId),
  };
}

function StaffMemberLinkActions({
  venueId,
  venueSlug,
  member,
  posts,
  screensByStation,
  labels,
  busy,
  onTokenRotated,
  compact = false,
}: {
  venueId: string;
  venueSlug: string;
  member: StaffMember;
  posts: VenuePost[];
  screensByStation: StaffScreensByStation;
  labels: {
    viewLink: string;
    viewLinkTablet: string;
    copyLink: string;
    copied: string;
    rotateLink: string;
    rotateConfirm: (name: string) => string;
    missingScreen: string;
    invalidAssignment: string;
  };
  busy: boolean;
  onTokenRotated: (memberId: string, memberToken: string) => void;
  compact?: boolean;
}) {
  const access = useMemo(
    () => memberAccessLink(venueSlug, member, posts, screensByStation),
    [venueSlug, member, posts, screensByStation],
  );
  const viewLabel =
    access.kind === "pass" ? labels.viewLinkTablet : labels.viewLink;
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  if (access.kind === "invalid-assignment") {
    return (
      <p className="text-center text-[10px] leading-snug text-amber-700" title={labels.invalidAssignment}>
        {labels.invalidAssignment}
      </p>
    );
  }

  if (access.kind === "missing-screen") {
    return (
      <p className="text-center text-[10px] leading-snug text-amber-700">
        {labels.missingScreen}{" "}
        <Link href="/dashboard/settings?tab=staff" className="font-semibold underline">
          →
        </Link>
      </p>
    );
  }

  const url = access.url;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function rotate() {
    if (!(await confirmWarning(labels.rotateConfirm(member.name)))) return;
    setRotating(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members/${member.id}/rotate-token`, {
        method: "POST",
      });
      const data = (await res.json()) as { memberToken?: string; error?: string };
      if (!res.ok || !data.memberToken) {
        window.alert(data.error ?? "Αποτυχία.");
        return;
      }
      onTokenRotated(member.id, data.memberToken);
    } finally {
      setRotating(false);
    }
  }

  return compact ? (
    <div className="flex items-center justify-center gap-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
        title={viewLabel}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span className="sr-only">{viewLabel}</span>
      </a>
      <button
        type="button"
        disabled={busy}
        onClick={() => void copy()}
        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
        title={copied ? labels.copied : labels.copyLink}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="sr-only">{copied ? labels.copied : labels.copyLink}</span>
      </button>
      {access.kind === "waiter" ? (
        <button
          type="button"
          disabled={busy || rotating}
          onClick={() => void rotate()}
          className={dashboardTextActionClass("warning")}
          title={labels.rotateLink}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
          <span className="sr-only">{labels.rotateLink}</span>
        </button>
      ) : null}
    </div>
  ) : (
    <div className="space-y-2">
      <input
        type="text"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="w-full min-w-[12rem] rounded-button border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        aria-label={labels.copyLink}
      />
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {viewLabel}
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={() => void copy()}
          className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? labels.copied : labels.copyLink}
        </button>
        {access.kind === "waiter" ? (
          <button
            type="button"
            disabled={busy || rotating}
            onClick={() => void rotate()}
            className={dashboardTextActionClass("warning")}
            title={labels.rotateLink}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
            {labels.rotateLink}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StaffMessagesChips({
  config,
  scopeId,
  langCode,
  emptyHint,
  compact = false,
}: {
  config: VenueOperationsConfig | null;
  scopeId: string;
  langCode: "GR" | "EN";
  emptyHint?: string;
  compact?: boolean;
}) {
  const enabledPosts = useMemo(
    () => enabledVenuePosts(config ?? undefined, langCode),
    [config, langCode],
  );
  const colorIndex =
    scopeId === "services" ? 0 : enabledPosts.findIndex((post) => post.id === scopeId) + 1;
  const color = getPostMessageColor(config ?? undefined, scopeId, colorIndex);
  const visible = useMemo(
    () => visibleMessagesForStaffAssignment(config ?? undefined, scopeId, langCode),
    [config, scopeId, langCode],
  );
  const items = [...new Set(visible.labels.filter(Boolean))];
  if (items.length === 0) {
    return emptyHint ? (
      <p className={`text-slate-400 ${compact ? "text-[10px]" : "mt-1.5 text-[11px]"}`}>
        {emptyHint}
      </p>
    ) : null;
  }
  const maxItems = compact ? 4 : 5;
  return (
    <ul className={`flex flex-wrap ${compact ? "gap-0.5" : "mt-1.5 gap-1"}`}>
      {items.slice(0, maxItems).map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={`max-w-[7.5rem] truncate rounded-full font-medium ${
            compact ? "px-1.5 py-px text-[9px] leading-4" : "px-2 py-0.5 text-[10px] font-semibold"
          }`}
          style={{
            backgroundColor: `${color}18`,
            color,
            border: `1px solid ${color}40`,
          }}
          title={item}
        >
          {item}
        </li>
      ))}
      {items.length > maxItems ? (
        <li className={`self-center text-slate-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
          +{items.length - maxItems}
        </li>
      ) : null}
    </ul>
  );
}

export function VenueStaffSetup({ venues }: { venues: Venue[] }) {
  const { d, lang } = useDashboardCopy();
  const S = d.pages.settings.personnel;
  const langCode = lang === "EN" ? "EN" : "GR";
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const { config: opsConfig, loading: opsLoading } = useVenueOperationsConfig(venueId);
  const { spots, loading: spotsLoading } = useVenueSpots(venueId);
  const venuePosts = useMemo(
    () => listVenuePosts(opsConfig ?? undefined, langCode),
    [opsConfig, langCode],
  );
  const enabledPosts = useMemo(
    () => enabledVenuePosts(opsConfig ?? undefined, langCode),
    [opsConfig, langCode],
  );
  const zoneGroups = useMemo(() => {
    const groups = groupVenueSpotsByZone(spots);
    return applyZoneLabelOverrides(groups, opsConfig?.zoneLabels);
  }, [spots, opsConfig?.zoneLabels]);

  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [postAssignment, setPostAssignment] = useState("services");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editZoneId, setEditZoneId] = useState("");
  const [editPostAssignment, setEditPostAssignment] = useState("services");
  const [busy, setBusy] = useState<string | null>(null);
  const [screensByStation, setScreensByStation] = useState<StaffScreensByStation>({});
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const loadGenerationRef = useRef(0);
  const screenLoadGenerationRef = useRef(0);

  const venue = venues.find((v) => v.id === venueId);
  const zonesReady = !spotsLoading && zoneGroups.length > 0;
  const postsReady = !opsLoading;

  useEffect(() => {
    if (zoneGroups.length === 0) return;
    if (staffPostRequiresZoneAssignment(postAssignment) && !zoneId) {
      setZoneId(zoneGroups[0]!.id);
    }
  }, [zoneGroups, postAssignment, zoneId]);

  function zoneLabel(id: string | null | undefined): string {
    if (!id) return S.colSpaceAll;
    return zoneGroups.find((z) => z.id === id)?.label ?? id;
  }

  function zoneLabelForMember(member: StaffMember): string {
    const assignment = staffPrimaryAssignment(member.stations);
    if (!staffPostRequiresZoneAssignment(assignment)) return S.colSpaceAll;
    return zoneLabel(member.zoneId);
  }

  function messageScopeForPost(post: string): string | null {
    if (post === "services" || post === "all") return null;
    if (enabledPosts.some((row) => row.id === post)) return post;
    return null;
  }

  function postOptions(): Array<{ id: string; label: string }> {
    return [
      { id: "services", label: staffPostPickerLabel("services", langCode, venuePosts) },
      ...enabledPosts.map((post) => ({
        id: post.id,
        label: staffPostPickerLabel(post.id, langCode, venuePosts),
      })),
    ];
  }

  function roleLabelFromPost(assignment: string): string {
    return staffAssignmentLabelForLang(assignment, langCode, venuePosts);
  }

  function onMemberTokenRotated(memberId: string, memberToken: string) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, memberToken } : m)));
  }

  const reload = useCallback(async () => {
    if (!venueId) {
      setMembers([]);
      return;
    }
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members`);
      const data = await res.json();
      if (generation !== loadGenerationRef.current) return;
      setMembers(res.ok ? (data.members ?? []) : []);
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setMembers([]);
  }, [venueId]);

  useEffect(() => {
    if (venues.length && !venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reloadScreens = useCallback(async () => {
    if (!venueId) {
      setScreensByStation({});
      return;
    }
    const generation = ++screenLoadGenerationRef.current;
    const next: StaffScreensByStation = {};
    await Promise.all(
      PASS_STATIONS.map(async (station) => {
        const res = await fetch(`/api/venues/${venueId}/station-screens?station=${station}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          screens?: Array<{ label: string; screenToken: string }>;
        };
        if (data.screens?.length) next[station] = data.screens;
      }),
    );
    if (generation === screenLoadGenerationRef.current) {
      setScreensByStation(next);
    }
  }, [venueId]);

  useEffect(() => {
    void reloadScreens();
  }, [reloadScreens]);

  useEffect(() => {
    const refresh = () => void reloadScreens();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reloadScreens]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !name.trim()) return;
    if (staffPostRequiresZoneAssignment(postAssignment) && !zoneId) {
      setFlash({ type: "error", text: S.zoneRequired });
      return;
    }
    setBusy("add");
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          roleLabel: roleLabelFromPost(postAssignment),
          zoneId: zoneId || null,
          stations: staffAssignmentsFromPrimary(postAssignment),
          messageScope: messageScopeForPost(postAssignment),
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setName("");
        setPostAssignment("services");
        setZoneId("");
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  function startEdit(member: StaffMember) {
    const assignment = staffPrimaryAssignment(member.stations);
    setEditingId(member.id);
    setEditName(member.name);
    setEditZoneId(staffPostRequiresZoneAssignment(assignment) ? (member.zoneId ?? "") : "");
    setEditPostAssignment(assignment);
  }

  async function saveEdit(memberId: string) {
    if (!venueId) return;
    if (!editZoneId && staffPostRequiresZoneAssignment(editPostAssignment)) {
      setFlash({ type: "error", text: S.zoneRequired });
      return;
    }
    setBusy(`edit-${memberId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          roleLabel: roleLabelFromPost(editPostAssignment),
          zoneId: editZoneId || null,
          stations: staffAssignmentsFromPrimary(editPostAssignment),
          messageScope: messageScopeForPost(editPostAssignment),
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setEditingId(null);
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(memberId: string, memberName: string) {
    if (!venueId || !(await confirmDestructive(S.deleteConfirm(memberName)))) return;
    setBusy(`del-${memberId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members/${memberId}`, {
        method: "DELETE",
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
        <p className="text-sm text-slate-600">{d.pages.qr.needVenueDesc}</p>
      </div>
    );
  }

  const linkLabels = {
    viewLink: S.viewLink,
    viewLinkTablet: S.viewLinkTablet,
    copyLink: S.copyLink,
    copied: S.copied,
    rotateLink: S.rotateLink,
    rotateConfirm: S.rotateConfirm,
    missingScreen: S.missingScreen,
    invalidAssignment: S.invalidAssignment,
  };

  function renderAssignmentFields(
    values: {
      name: string;
      zone: string;
      post: string;
    },
    onChange: {
      setName: (v: string) => void;
      setZone: (v: string) => void;
      setPost: (v: string) => void;
    },
  ) {
    const chipsScope = messageScopeForPost(values.post);
    return (
      <>
        <td className="px-3 py-2 align-top">
          <input
            value={values.name}
            onChange={(e) => onChange.setName(e.target.value)}
            maxLength={60}
            placeholder={S.namePlaceholder}
            className={`${dashboardFieldClass} w-full min-w-[8rem] text-sm`}
          />
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={values.zone}
            onChange={(e) => onChange.setZone(e.target.value)}
            required={staffPostRequiresZoneAssignment(values.post)}
            className={`${dashboardFieldClass} w-full min-w-[8rem] text-sm`}
          >
            {staffPostRequiresZoneAssignment(values.post) ? (
              <option value="" disabled>
                {S.selectSpacePlaceholder}
              </option>
            ) : (
              <option value="">{S.colSpaceAll}</option>
            )}
            {zoneGroups.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.label}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={values.post}
            required
            onChange={(e) => {
              const next = e.target.value;
              onChange.setPost(next);
              if (staffPostRequiresZoneAssignment(next)) {
                if (!values.zone && zoneGroups[0]) onChange.setZone(zoneGroups[0]!.id);
              } else {
                onChange.setZone("");
              }
            }}
            className={`${dashboardFieldClass} w-full min-w-[8rem] text-sm`}
          >
            {postOptions().map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {chipsScope ? (
            <>
              <p className="mt-1 text-[10px] font-medium text-slate-500">{S.messagesScopeTablet}</p>
              <StaffMessagesChips
                config={opsConfig}
                scopeId={chipsScope}
                langCode={langCode}
                compact
                emptyHint={S.messagesPreviewEmpty}
              />
            </>
          ) : (
            <p className="mt-1.5 text-[10px] leading-snug text-slate-400">{S.messagesScopeWaiter}</p>
          )}
        </td>
      </>
    );
  }

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={dashboardCardClass}>
        <h2 className="text-base font-semibold text-brand-navy">{S.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{S.description}</p>

        {venues.length > 1 ? (
          <label className="mt-4 block max-w-md">
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
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-medium text-brand-navy">{venue?.name}</span>
          </p>
        )}

        <form onSubmit={(e) => void addMember(e)} className="mt-6 space-y-4">
          <p className="text-sm font-semibold text-brand-navy">{S.addTitle}</p>
          {!postsReady ? (
            <p className="text-sm text-slate-600">{S.loading}</p>
          ) : staffPostRequiresZoneAssignment(postAssignment) && !zonesReady ? (
            <p className="text-sm text-slate-600">
              {S.noSpaces}{" "}
              <Link href="/dashboard/settings?tab=spaces" className="font-medium text-brand-blue hover:underline">
                {S.manageSpacesLink}
              </Link>
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5">{S.colName}</th>
                      <th className="px-3 py-2.5">{S.colSpaceRequired}</th>
                      <th className="px-3 py-2.5">{S.colPostRequired}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      {renderAssignmentFields(
                        {
                          name,
                          zone: zoneId,
                          post: postAssignment,
                        },
                        {
                          setName,
                          setZone: setZoneId,
                          setPost: setPostAssignment,
                        },
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">{S.fieldsRequiredHint}</p>
              <p className="text-xs text-slate-500">{S.formHint}</p>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    busy !== null ||
                    !name.trim() ||
                    (staffPostRequiresZoneAssignment(postAssignment) && !zoneId)
                  }
                  className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "md")}`}
                >
                  <Plus className="h-4 w-4" />
                  {busy === "add" ? S.saving : S.addStaff}
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      <div className={dashboardCardClass}>
        <h3 className="text-sm font-semibold text-brand-navy">{S.listTitle}</h3>
        <p className="mt-1 text-xs text-slate-500">{S.colLinkHint}</p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">{S.loading}</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{S.empty}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/90">
              <table className="w-full min-w-[52rem] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-[14%] px-4 py-3">{S.colName}</th>
                    <th className="w-[12%] px-4 py-3">{S.colSpaceRequired}</th>
                    <th className="min-w-[10rem] px-4 py-3">{S.colPostRequired}</th>
                    <th className="w-[9rem] px-4 py-3 text-center">{S.colLink}</th>
                    <th className="w-[5.5rem] px-4 py-3 text-center">{S.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isEditing = editingId === member.id;
                    const isBusy = busy !== null;

                    if (isEditing) {
                      return (
                        <tr key={member.id} className="border-b border-slate-50 bg-blue-50/30">
                          {renderAssignmentFields(
                            {
                              name: editName,
                              zone: editZoneId,
                              post: editPostAssignment,
                            },
                            {
                              setName: setEditName,
                              setZone: setEditZoneId,
                              setPost: setEditPostAssignment,
                            },
                          )}
                          <td className="px-4 py-3 align-top text-right" colSpan={2}>
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                              >
                                <X className="h-4 w-4" />
                                {S.cancelEdit}
                              </button>
                              <button
                                type="button"
                                disabled={
                                  isBusy ||
                                  !editName.trim() ||
                                  (staffPostRequiresZoneAssignment(editPostAssignment) &&
                                    !editZoneId)
                                }
                                onClick={() => void saveEdit(member.id)}
                                className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
                              >
                                {S.saveEdit}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const primaryPost = staffPrimaryAssignment(member.stations);
                    const chipsScope = messageScopeForPost(primaryPost);
                    const postStationSubtitle = staffPostStationSubtitle(
                      primaryPost,
                      langCode,
                      venuePosts,
                    );

                    return (
                      <tr key={member.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                        <td className="px-4 py-3 align-middle font-medium text-brand-navy">
                          {member.name}
                        </td>
                        <td className="px-4 py-3 align-middle text-slate-600">
                          {zoneLabelForMember(member)}
                        </td>
                        <td className="px-4 py-3 align-middle text-slate-600">
                          <p>
                            {staffAssignmentLabelForLang(primaryPost, langCode, venuePosts)}
                          </p>
                          {postStationSubtitle ? (
                            <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                              {postStationSubtitle}
                            </p>
                          ) : null}
                          {chipsScope ? (
                            <>
                              <p className="mt-1 text-[10px] font-medium text-slate-500">
                                {S.messagesScopeTablet}
                              </p>
                              <StaffMessagesChips
                                config={opsConfig}
                                scopeId={chipsScope}
                                langCode={langCode}
                                compact
                              />
                            </>
                          ) : (
                            <p className="mt-1 text-[10px] leading-snug text-slate-400">
                              {S.messagesScopeWaiter}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {venue?.slug ? (
                            <StaffMemberLinkActions
                              venueId={venueId}
                              venueSlug={venue.slug}
                              member={member}
                              posts={venuePosts}
                              screensByStation={screensByStation}
                              labels={linkLabels}
                              busy={busy !== null}
                              onTokenRotated={onMemberTokenRotated}
                              compact
                            />
                          ) : (
                            <span className="block text-center text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <DashboardIconButton
                              variant="neutral"
                              disabled={isBusy}
                              onClick={() => startEdit(member)}
                              label={S.edit}
                            >
                              <Pencil className="h-4 w-4" />
                            </DashboardIconButton>
                            <DashboardIconButton
                              variant="danger"
                              disabled={isBusy}
                              onClick={() => void removeMember(member.id, member.name)}
                              label={S.deleteTitle}
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
        )}
      </div>
    </div>
  );
}
