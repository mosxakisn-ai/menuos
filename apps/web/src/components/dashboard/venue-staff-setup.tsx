"use client";

import { Check, Copy, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatStaffStationsForLang,
  STAFF_STATION_OPTIONS,
  type StaffStationOption,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { WaiterShareLink } from "@/components/dashboard/waiter-share-link";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { clientShareOrigin } from "@/lib/client-share-origin";
import { cn } from "@/lib/utils";

type Venue = { id: string; name: string; slug: string; staffToken?: string };
type StaffMember = {
  id: string;
  name: string;
  roleLabel: string;
  stations: string[];
  memberToken: string;
};

function memberWaiterUrl(venueSlug: string, memberToken: string): string {
  const u = new URL("/api/staff/session", clientShareOrigin());
  u.searchParams.set("venueSlug", venueSlug);
  u.searchParams.set("key", memberToken);
  return u.toString();
}

function toggleStation(
  current: StaffStationOption[],
  station: StaffStationOption,
): StaffStationOption[] {
  if (station === "all") {
    return current.includes("all") ? ["services"] : ["all"];
  }
  const withoutAll = current.filter((s) => s !== "all");
  if (withoutAll.includes(station)) {
    const next = withoutAll.filter((s) => s !== station);
    return next.length > 0 ? next : ["services"];
  }
  return [...withoutAll, station];
}

function StationPicker({
  value,
  onChange,
  labels,
}: {
  value: StaffStationOption[];
  onChange: (next: StaffStationOption[]) => void;
  labels: Record<StaffStationOption, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STAFF_STATION_OPTIONS.map((station) => {
        const selected = value.includes(station);
        return (
          <button
            key={station}
            type="button"
            onClick={() => onChange(toggleStation(value, station))}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              selected
                ? "border-brand-blue bg-blue-50 text-brand-blue"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {labels[station]}
          </button>
        );
      })}
    </div>
  );
}

function StationBadges({
  stations,
  labels,
  lang,
}: {
  stations: string[];
  labels: Record<StaffStationOption, string>;
  lang: "GR" | "EN";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {stations.map((station) => (
        <span
          key={station}
          className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700"
        >
          {labels[station as StaffStationOption] ??
            formatStaffStationsForLang([station], lang)}
        </span>
      ))}
    </div>
  );
}

function StaffMemberLinkActions({
  venueId,
  venueSlug,
  member,
  labels,
  busy,
  onTokenRotated,
}: {
  venueId: string;
  venueSlug: string;
  member: StaffMember;
  labels: {
    copyLink: string;
    copied: string;
    rotateLink: string;
    rotateConfirm: (name: string) => string;
  };
  busy: boolean;
  onTokenRotated: (memberId: string, memberToken: string) => void;
}) {
  const url = useMemo(() => memberWaiterUrl(venueSlug, member.memberToken), [venueSlug, member.memberToken]);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

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
    if (!window.confirm(labels.rotateConfirm(member.name))) return;
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

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
      <button
        type="button"
        disabled={busy}
        onClick={() => void copy()}
        className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")}`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? labels.copied : labels.copyLink}
      </button>
      <button
        type="button"
        disabled={busy || rotating}
        onClick={() => void rotate()}
        className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
        title={labels.rotateLink}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
        {labels.rotateLink}
      </button>
    </div>
  );
}

export function VenueStaffSetup({ venues }: { venues: Venue[] }) {
  const { d, lang } = useDashboardCopy();
  const S = d.pages.settings.personnel;
  const stationLabels = S.stationLabels as Record<StaffStationOption, string>;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [stations, setStations] = useState<StaffStationOption[]>(["services"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStations, setEditStations] = useState<StaffStationOption[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const loadGenerationRef = useRef(0);

  const venue = venues.find((v) => v.id === venueId);
  const [sharedStaffToken, setSharedStaffToken] = useState(venue?.staffToken ?? "");

  useEffect(() => {
    setSharedStaffToken(venue?.staffToken ?? "");
  }, [venue?.staffToken]);

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

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !name.trim() || !roleLabel.trim()) return;
    setBusy("add");
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), roleLabel: roleLabel.trim(), stations }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setName("");
        setRoleLabel("");
        setStations(["services"]);
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  function startEdit(member: StaffMember) {
    setEditingId(member.id);
    setEditName(member.name);
    setEditRole(member.roleLabel);
    setEditStations(member.stations as StaffStationOption[]);
  }

  async function saveEdit(memberId: string) {
    if (!venueId) return;
    setBusy(`edit-${memberId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          roleLabel: editRole.trim(),
          stations: editStations,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setEditingId(null);
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(memberId: string, memberName: string) {
    if (!venueId || !window.confirm(S.deleteConfirm(memberName))) return;
    setBusy(`del-${memberId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
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
    copyLink: S.copyLink,
    copied: S.copied,
    rotateLink: S.rotateLink,
    rotateConfirm: S.rotateConfirm,
  };

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

        <form
          onSubmit={(e) => void addMember(e)}
          className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 sm:p-5"
        >
          <p className="text-sm font-semibold text-brand-navy">{S.addTitle}</p>
          <div className={`${dashboardFormGridClass} mt-4`}>
            <label className="block">
              <span className={dashboardLabelClass}>{S.colName}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder={S.namePlaceholder}
                className={dashboardFieldClass}
              />
            </label>
            <label className="block">
              <span className={dashboardLabelClass}>{S.colRole}</span>
              <input
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                maxLength={40}
                placeholder={S.rolePlaceholder}
                className={dashboardFieldClass}
              />
            </label>
          </div>
          <div className="mt-4">
            <span className={dashboardLabelClass}>{S.colStations}</span>
            <p className="mt-1 text-xs text-slate-500">{S.stationsHint}</p>
            <div className="mt-2">
              <StationPicker value={stations} onChange={setStations} labels={stationLabels} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={busy !== null || !name.trim() || !roleLabel.trim()}
              className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "md")}`}
            >
              <Plus className="h-4 w-4" />
              {busy === "add" ? S.saving : S.addStaff}
            </button>
          </div>
        </form>
      </div>

      <div className={dashboardCardClass}>
        <h3 className="text-sm font-semibold text-brand-navy">{S.listTitle}</h3>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">{S.loading}</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{S.empty}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {members.map((member) => {
              const isEditing = editingId === member.id;
              const isBusy = busy !== null;

              if (isEditing) {
                return (
                  <li
                    key={member.id}
                    className="rounded-xl border-2 border-brand-blue/25 bg-blue-50/30 p-4 sm:p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                      {S.editTitle}
                    </p>
                    <div className={`${dashboardFormGridClass} mt-4`}>
                      <label className="block">
                        <span className={dashboardLabelClass}>{S.colName}</span>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={60}
                          className={dashboardFieldClass}
                          autoFocus
                        />
                      </label>
                      <label className="block">
                        <span className={dashboardLabelClass}>{S.colRole}</span>
                        <input
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          maxLength={40}
                          className={dashboardFieldClass}
                        />
                      </label>
                    </div>
                    <div className="mt-4">
                      <span className={dashboardLabelClass}>{S.colStations}</span>
                      <div className="mt-2">
                        <StationPicker
                          value={editStations}
                          onChange={setEditStations}
                          labels={stationLabels}
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                      >
                        <X className="h-4 w-4" />
                        {S.cancelEdit}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || !editName.trim() || !editRole.trim()}
                        onClick={() => void saveEdit(member.id)}
                        className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")}`}
                      >
                        {S.saveEdit}
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={member.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-brand-navy">{member.name}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{member.roleLabel}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => startEdit(member)}
                        className={buttonClass("secondary", "sm")}
                        aria-label={S.edit}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void removeMember(member.id, member.name)}
                        className={`${buttonClass("secondary", "sm")} text-red-700`}
                        aria-label={S.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 sm:items-center">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {S.colStations}
                      </p>
                      <div className="mt-2">
                        <StationBadges stations={member.stations} labels={stationLabels} lang={lang} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {S.colLink}
                      </p>
                      <div className="mt-2">
                        {venue?.slug ? (
                          <StaffMemberLinkActions
                            venueId={venueId}
                            venueSlug={venue.slug}
                            member={member}
                            labels={linkLabels}
                            busy={isBusy}
                            onTokenRotated={onMemberTokenRotated}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {venue?.slug && sharedStaffToken ? (
        <details className={`${dashboardCardClass} group`}>
          <summary className="cursor-pointer list-none text-sm font-semibold text-primary marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              {S.sharedLinkTitle}
              <span className="text-xs font-normal text-slate-500">({S.sharedLinkOptional})</span>
            </span>
          </summary>
          <p className="mt-3 text-sm text-slate-600">{S.sharedLinkHint}</p>
          <div className="mt-4">
            <WaiterShareLink
              venueSlug={venue.slug}
              staffToken={sharedStaffToken}
              venueId={venue.id}
              onStaffTokenRotated={setSharedStaffToken}
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}
