"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  enabledVenuePosts,
  listVenuePosts,
  STAFF_SPECIAL_OPTIONS,
  staffAssignmentLabelForLang,
  staffStationLabelForLang,
  type PassStationInput,
  type VenuePost,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
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
import { buildStaffShareUrl } from "@/lib/staff-share-url";
import { cn } from "@/lib/utils";

type Venue = { id: string; name: string; slug: string };
type StaffMember = {
  id: string;
  name: string;
  roleLabel: string;
  stations: string[];
  memberToken: string;
};

function memberWaiterUrl(venueSlug: string, memberToken: string): string {
  return buildStaffShareUrl(venueSlug, memberToken);
}

function toggleAssignment(current: string[], assignment: string): string[] {
  if (assignment === "all") {
    return current.includes("all") ? ["services"] : ["all"];
  }
  const withoutAll = current.filter((s) => s !== "all");
  if (withoutAll.includes(assignment)) {
    const next = withoutAll.filter((s) => s !== assignment);
    return next.length > 0 ? next : ["services"];
  }
  return [...withoutAll, assignment];
}

const POST_STATION_BADGE_STYLES: Record<PassStationInput, string> = {
  kitchen: "border-orange-200 bg-orange-50 text-orange-900",
  bar: "border-emerald-200 bg-emerald-50 text-emerald-900",
  cold: "border-sky-200 bg-sky-50 text-sky-900",
  dessert: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
};

const SPECIAL_BADGE_STYLES: Record<(typeof STAFF_SPECIAL_OPTIONS)[number], string> = {
  services: "border-blue-200 bg-blue-50 text-blue-900",
  all: "border-violet-200 bg-violet-50 text-violet-900",
};

function assignmentBadgeStyle(assignment: string, posts: VenuePost[]): string {
  if (assignment === "services" || assignment === "all") {
    return SPECIAL_BADGE_STYLES[assignment];
  }
  const post = posts.find((row) => row.id === assignment);
  if (post) return POST_STATION_BADGE_STYLES[post.station];
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function PostPicker({
  value,
  onChange,
  posts,
  lang,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  posts: VenuePost[];
  lang: "GR" | "EN";
}) {
  const options: Array<{ id: string; label: string }> = [
    { id: "services", label: staffStationLabelForLang("services", lang) },
    ...posts.map((post) => ({ id: post.id, label: post.label.trim() })),
    { id: "all", label: staffStationLabelForLang("all", lang) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(toggleAssignment(value, option.id))}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              selected
                ? assignmentBadgeStyle(option.id, posts)
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PostBadges({
  assignments,
  posts,
  lang,
}: {
  assignments: string[];
  posts: VenuePost[];
  lang: "GR" | "EN";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {assignments.map((assignment) => (
        <span
          key={assignment}
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
            assignmentBadgeStyle(assignment, posts),
          )}
        >
          {staffAssignmentLabelForLang(assignment, lang, posts)}
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
    viewLink: string;
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

  return (
    <div className="space-y-2">
      <input
        type="text"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-button border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
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
          {labels.viewLink}
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
      </div>
    </div>
  );
}

export function VenueStaffSetup({ venues }: { venues: Venue[] }) {
  const { d, lang } = useDashboardCopy();
  const S = d.pages.settings.personnel;
  const langCode = lang === "EN" ? "EN" : "GR";
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const { config: opsConfig, loading: opsLoading } = useVenueOperationsConfig(venueId);
  const venuePosts = useMemo(
    () => listVenuePosts(opsConfig ?? undefined, langCode),
    [opsConfig, langCode],
  );
  const enabledPosts = useMemo(
    () => enabledVenuePosts(opsConfig ?? undefined, langCode),
    [opsConfig, langCode],
  );
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [stations, setStations] = useState<string[]>(["services"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStations, setEditStations] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const loadGenerationRef = useRef(0);

  const venue = venues.find((v) => v.id === venueId);

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
      showFromResponse(data, res.ok, res.status);
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
    setEditStations(member.stations);
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
            {opsLoading || !opsConfig ? (
              <p className="mt-2 text-sm text-slate-500">{S.loading}</p>
            ) : enabledPosts.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                {S.noPosts}{" "}
                <Link href="/dashboard/settings?tab=posts" className="font-medium text-brand-blue hover:underline">
                  {S.managePostsLink}
                </Link>
              </p>
            ) : (
              <>
                <div className="mt-2">
                  <PostPicker
                    value={stations}
                    onChange={setStations}
                    posts={enabledPosts}
                    lang={langCode}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  <Link href="/dashboard/settings?tab=posts" className="font-medium text-brand-blue hover:underline">
                    {S.managePostsLink}
                  </Link>
                </p>
              </>
            )}
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
                        <PostPicker
                          value={editStations}
                          onChange={setEditStations}
                          posts={enabledPosts}
                          lang={langCode}
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
                  </div>

                  <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{S.colStations}</p>
                      <div className="mt-2">
                        <PostBadges
                          assignments={member.stations}
                          posts={venuePosts}
                          lang={langCode}
                        />
                      </div>
                    </div>
                    {venue?.slug ? (
                      <div>
                        <p className="text-xs font-medium text-slate-500">{S.colLink}</p>
                        <p className="mt-1 text-xs text-slate-500">{S.colLinkHint}</p>
                        <div className="mt-2">
                          <StaffMemberLinkActions
                            venueId={venueId}
                            venueSlug={venue.slug}
                            member={member}
                            labels={linkLabels}
                            busy={isBusy}
                            onTokenRotated={onMemberTokenRotated}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
