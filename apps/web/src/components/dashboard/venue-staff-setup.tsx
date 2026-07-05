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
  resolveStaffMessageScope,
  staffAssignmentLabelForLang,
  staffAssignmentsFromPrimary,
  staffPrimaryAssignment,
  staffRoleOptionsForLang,
  staffRoleOptionsWithLegacy,
  staffStationLabelForLang,
  visibleMessagesForStaffAssignment,
  type VenueOperationsConfig,
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
import { buildStaffShareUrl } from "@/lib/staff-share-url";

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

function memberWaiterUrl(venueSlug: string, memberToken: string, zoneId?: string | null) {
  return buildStaffShareUrl(venueSlug, memberToken, zoneId);
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
  const url = useMemo(
    () => memberWaiterUrl(venueSlug, member.memberToken, member.zoneId),
    [venueSlug, member.memberToken, member.zoneId],
  );
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

function StaffMessagesChips({
  config,
  scopeId,
  langCode,
  emptyHint,
}: {
  config: VenueOperationsConfig | null;
  scopeId: string;
  langCode: "GR" | "EN";
  emptyHint?: string;
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
    return emptyHint ? <p className="mt-1.5 text-[11px] text-slate-400">{emptyHint}</p> : null;
  }
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1">
      {items.slice(0, 5).map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            backgroundColor: `${color}18`,
            color,
            border: `1px solid ${color}40`,
          }}
        >
          {item}
        </li>
      ))}
      {items.length > 5 ? (
        <li className="self-center text-[10px] text-slate-400">+{items.length - 5}</li>
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
  const [roleLabel, setRoleLabel] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [postAssignment, setPostAssignment] = useState("services");
  const [messageScope, setMessageScope] = useState("services");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editZoneId, setEditZoneId] = useState("");
  const [editPostAssignment, setEditPostAssignment] = useState("services");
  const [editMessageScope, setEditMessageScope] = useState("services");
  const [busy, setBusy] = useState<string | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const loadGenerationRef = useRef(0);

  const venue = venues.find((v) => v.id === venueId);
  const zonesReady = !spotsLoading && zoneGroups.length > 0;
  const postsReady = !opsLoading;

  useEffect(() => {
    if (zoneGroups.length > 0 && !zoneId) {
      setZoneId(zoneGroups[0]!.id);
    }
  }, [zoneGroups, zoneId]);

  function zoneLabel(id: string | null | undefined): string {
    if (!id) return "—";
    return zoneGroups.find((z) => z.id === id)?.label ?? id;
  }

  function postOptions(): Array<{ id: string; label: string }> {
    return [
      { id: "services", label: staffStationLabelForLang("services", langCode) },
      ...enabledPosts.map((post) => ({ id: post.id, label: post.label.trim() })),
    ];
  }

  function messageScopeOptions(): Array<{ id: string; label: string }> {
    return [
      { id: "services", label: S.messagesScopeServices },
      ...enabledPosts.map((post) => ({ id: post.id, label: post.label.trim() })),
    ];
  }

  function messageScopeLabel(scopeId: string): string {
    return messageScopeOptions().find((option) => option.id === scopeId)?.label ?? scopeId;
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

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !name.trim() || !roleLabel.trim() || !zoneId) return;
    setBusy("add");
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          roleLabel: roleLabel.trim(),
          zoneId,
          stations: staffAssignmentsFromPrimary(postAssignment),
          messageScope,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setName("");
        setRoleLabel("");
        setPostAssignment("services");
        setMessageScope("services");
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
    setEditZoneId(member.zoneId ?? zoneGroups[0]?.id ?? "");
    setEditPostAssignment(staffPrimaryAssignment(member.stations));
    setEditMessageScope(resolveStaffMessageScope(member, venuePosts));
  }

  async function saveEdit(memberId: string) {
    if (!venueId || !editZoneId) return;
    setBusy(`edit-${memberId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          roleLabel: editRole.trim(),
          zoneId: editZoneId,
          stations: staffAssignmentsFromPrimary(editPostAssignment),
          messageScope: editMessageScope,
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

  const roleListId = "staff-role-suggestions";

  function renderAssignmentFields(
    values: {
      name: string;
      role: string;
      zone: string;
      post: string;
      messages: string;
    },
    onChange: {
      setName: (v: string) => void;
      setRole: (v: string) => void;
      setZone: (v: string) => void;
      setPost: (v: string) => void;
      setMessages: (v: string) => void;
    },
    roleOptions: readonly string[],
  ) {
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
          <input
            value={values.role}
            onChange={(e) => onChange.setRole(e.target.value)}
            list={roleListId}
            maxLength={40}
            placeholder={S.rolePlaceholder}
            className={`${dashboardFieldClass} w-full min-w-[8rem] text-sm`}
          />
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={values.zone}
            onChange={(e) => onChange.setZone(e.target.value)}
            className={`${dashboardFieldClass} w-full min-w-[8rem] text-sm`}
          >
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
            onChange={(e) => onChange.setPost(e.target.value)}
            className={`${dashboardFieldClass} w-full min-w-[8rem] text-sm`}
          >
            {postOptions().map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={values.messages}
            onChange={(e) => onChange.setMessages(e.target.value)}
            className={`${dashboardFieldClass} w-full min-w-[9rem] text-sm`}
          >
            {messageScopeOptions().map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <StaffMessagesChips
            config={opsConfig}
            scopeId={values.messages}
            langCode={langCode}
            emptyHint={S.messagesPreviewEmpty}
          />
        </td>
      </>
    );
  }

  return (
    <div className="space-y-5">
      <datalist id={roleListId}>
        {staffRoleOptionsForLang(langCode).map((role) => (
          <option key={role} value={role} />
        ))}
      </datalist>

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
          {!zonesReady ? (
            <p className="text-sm text-slate-600">
              {S.noSpaces}{" "}
              <Link href="/dashboard/settings?tab=spaces" className="font-medium text-brand-blue hover:underline">
                {S.manageSpacesLink}
              </Link>
            </p>
          ) : !postsReady ? (
            <p className="text-sm text-slate-600">{S.loading}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5">{S.colName}</th>
                      <th className="px-3 py-2.5">{S.colRole}</th>
                      <th className="px-3 py-2.5">{S.colSpace}</th>
                      <th className="px-3 py-2.5">{S.colPost}</th>
                      <th className="px-3 py-2.5">{S.colMessages}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      {renderAssignmentFields(
                        {
                          name,
                          role: roleLabel,
                          zone: zoneId,
                          post: postAssignment,
                          messages: messageScope,
                        },
                        {
                          setName,
                          setRole: setRoleLabel,
                          setZone: setZoneId,
                          setPost: setPostAssignment,
                          setMessages: setMessageScope,
                        },
                        staffRoleOptionsForLang(langCode),
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">{S.formHint}</p>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busy !== null || !name.trim() || !roleLabel.trim() || !zoneId}
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
          <div className="mt-4 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2.5">{S.colName}</th>
                    <th className="px-3 py-2.5">{S.colRole}</th>
                    <th className="px-3 py-2.5">{S.colSpace}</th>
                    <th className="px-3 py-2.5">{S.colPost}</th>
                    <th className="px-3 py-2.5">{S.colMessages}</th>
                    <th className="px-3 py-2.5">{S.colLink}</th>
                    <th className="px-3 py-2.5 text-right">{S.colActions}</th>
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
                              role: editRole,
                              zone: editZoneId,
                              post: editPostAssignment,
                              messages: editMessageScope,
                            },
                            {
                              setName: setEditName,
                              setRole: setEditRole,
                              setZone: setEditZoneId,
                              setPost: setEditPostAssignment,
                              setMessages: setEditMessageScope,
                            },
                            staffRoleOptionsWithLegacy(langCode, editRole),
                          )}
                          <td className="px-3 py-2 align-top text-right" colSpan={2}>
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
                                disabled={isBusy || !editName.trim() || !editRole.trim() || !editZoneId}
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

                    const memberMessageScope = resolveStaffMessageScope(member, venuePosts);

                    return (
                      <tr key={member.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-brand-navy">{member.name}</td>
                        <td className="px-3 py-2.5 text-slate-600">{member.roleLabel}</td>
                        <td className="px-3 py-2.5 text-slate-600">{zoneLabel(member.zoneId)}</td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {staffAssignmentLabelForLang(
                            staffPrimaryAssignment(member.stations),
                            langCode,
                            venuePosts,
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          <p className="text-sm">{messageScopeLabel(memberMessageScope)}</p>
                          <StaffMessagesChips
                            config={opsConfig}
                            scopeId={memberMessageScope}
                            langCode={langCode}
                          />
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          {venue?.slug ? (
                            <StaffMemberLinkActions
                              venueId={venueId}
                              venueSlug={venue.slug}
                              member={member}
                              labels={linkLabels}
                              busy={busy !== null}
                              onTokenRotated={onMemberTokenRotated}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right align-top">
                          <div className="inline-flex items-center gap-1">
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
          </div>
        )}
      </div>
    </div>
  );
}
