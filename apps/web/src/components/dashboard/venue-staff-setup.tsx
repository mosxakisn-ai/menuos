"use client";

import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { PostDeviceBadge, ScreenDeviceLabel, type PostDeviceKind } from "@/components/dashboard/post-device-badge";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyZoneLabelOverrides,
  enabledVenuePosts,
  getPostMessageColor,
  groupVenueSpotsByZone,
  listVenuePosts,
  defaultStaffAssignmentForJobRole,
  pickStationScreenForStaffAssignment,
  resolveStaffAssignmentToPassInput,
  staffAssignmentLinkKind,
  staffAssignmentLabelForLang,
  staffAssignmentsFromPrimary,
  staffAssignableVenuePosts,
  staffJobRoleForAssignment,
  staffJobRoleLabel,
  staffPostOptionsForJobRole,
  staffPostPickerLabel,
  staffPostRequiresZoneAssignment,
  staffPostStationSubtitle,
  staffPrimaryAssignment,
  staffScreenDeviceForJobRole,
  visibleMessagesForStaffAssignment,
  type PassStationInput,
  type StaffJobRole,
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
  dashboardIconButtonClass,
  dashboardTextActionClass,
} from "@/components/dashboard/dashboard-action-button";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import { confirmDestructive, confirmWarning } from "@/lib/confirm-action";
import { notifyLive360Updated } from "@/lib/live360-events";
import { cn } from "@/lib/utils";
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

type StaffScreenCopy = {
  screenMobile: string;
  screenKds: string;
  screenSupportTablet: string;
  screenMobileHint: string;
  screenKdsHint: string;
  screenSupportTabletHint: string;
};

function staffDeviceLabelForContext(
  assignment: string,
  posts: VenuePost[],
  copy: StaffScreenCopy,
  fallbackRole?: StaffJobRole,
): {
  device: PostDeviceKind;
  labelMobile: string;
  labelTablet: string;
  hintMobile: string;
  hintTablet: string;
  station?: VenuePost["station"];
} {
  const linkKind =
    assignment.length > 0 ? staffAssignmentLinkKind(assignment, posts) : null;

  let device: PostDeviceKind;
  if (linkKind === "waiter") device = "mobile";
  else if (linkKind === "pass" || linkKind === "support") device = "kds";
  else if (linkKind === "invalid") device = "invalid";
  else device = staffScreenDeviceForJobRole(fallbackRole ?? "waiter");

  const isSupport = linkKind === "support";
  const post =
    assignment !== "all" && assignment !== "pass-all" && assignment !== "services"
      ? posts.find((row) => row.id === assignment)
      : undefined;

  return {
    device,
    labelMobile: copy.screenMobile,
    labelTablet: isSupport ? copy.screenSupportTablet : copy.screenKds,
    hintMobile: copy.screenMobileHint,
    hintTablet: isSupport ? copy.screenSupportTabletHint : copy.screenKdsHint,
    station: post?.station,
  };
}

function staffScreenCopyFromPersonnel(S: {
  screenMobile: string;
  screenKds: string;
  screenSupportTablet: string;
  screenMobileHint: string;
  screenKdsHint: string;
  screenSupportTabletHint: string;
}): StaffScreenCopy {
  return {
    screenMobile: S.screenMobile,
    screenKds: S.screenKds,
    screenSupportTablet: S.screenSupportTablet,
    screenMobileHint: S.screenMobileHint,
    screenKdsHint: S.screenKdsHint,
    screenSupportTabletHint: S.screenSupportTabletHint,
  };
}

function memberAccessLink(
  venueSlug: string,
  member: StaffMember,
  posts: VenuePost[],
  screensByStation: StaffScreensByStation,
): StaffAccessLink {
  if (member.stations.length === 0) return { kind: "invalid-assignment" };
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
        url: buildStationScreenShareUrl(picked.station, venueSlug, picked.screenToken, {
          allPosts: assignment === "pass-all",
        }),
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

function StaffAccessQrButton({
  venueId,
  memberId,
  memberName,
  memberToken,
  device,
  labels,
  disabled,
}: {
  venueId: string;
  memberId: string;
  memberName: string;
  memberToken: string;
  device: "mobile" | "tablet";
  labels: {
    qrLink: string;
    qrTitle: (name: string) => string;
    qrHintMobile: string;
    qrHintTablet: string;
    downloadQr: string;
    qrLoading: string;
    qrFailed: string;
    qrNetworkError: string;
    copyLink: string;
    copied: string;
    viewLink: string;
    viewLinkTablet: string;
  };
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessUrl, setAccessUrl] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const loadQr = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAccessUrl("");
    setPngDataUrl("");
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members/${memberId}/qr`);
      const data = (await res.json()) as {
        accessUrl?: string;
        pngDataUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.accessUrl || !data.pngDataUrl) {
        setError(data.error ?? labels.qrFailed);
        return;
      }
      setAccessUrl(data.accessUrl);
      setPngDataUrl(data.pngDataUrl);
    } catch {
      setError(labels.qrNetworkError);
    } finally {
      setLoading(false);
    }
  }, [venueId, memberId, labels.qrFailed, labels.qrNetworkError]);

  useEffect(() => {
    if (!open) return;
    void loadQr();
  }, [open, memberToken, loadQr]);

  async function copyUrl() {
    if (!accessUrl) return;
    try {
      await navigator.clipboard.writeText(accessUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function downloadPng() {
    if (!pngDataUrl) return;
    const a = document.createElement("a");
    a.href = pngDataUrl;
    a.download = `menuos-staff-${memberName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  }

  if (!open) {
    return (
      <DashboardIconButton
        variant="neutral"
        disabled={disabled}
        onClick={() => void setOpen(true)}
        label={labels.qrLink}
      >
        <QrCode className="h-4 w-4" />
      </DashboardIconButton>
    );
  }

  return (
    <>
      <DashboardIconButton
        variant="neutral"
        disabled={disabled}
        onClick={() => void setOpen(true)}
        label={labels.qrLink}
      >
        <QrCode className="h-4 w-4" />
      </DashboardIconButton>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        onClick={() => setOpen(false)}
      >
        <div
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card border border-brand-blue/20 bg-white p-5 shadow-xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-brand-navy">{labels.qrTitle(memberName)}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {device === "mobile" ? labels.qrHintMobile : labels.qrHintTablet}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Κλείσιμο"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex flex-col items-center text-center">
            {loading ? (
              <p className="py-12 text-sm text-slate-500">{labels.qrLoading}</p>
            ) : error ? (
              <p className="py-8 text-sm text-red-600">{error}</p>
            ) : pngDataUrl ? (
              <>
                <img
                  src={pngDataUrl}
                  alt={labels.qrTitle(memberName)}
                  className="h-52 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                />
                <p className="mt-4 w-full break-all text-left text-xs text-slate-600">{accessUrl}</p>
                <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={downloadPng}
                    className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")}`}
                  >
                    <Download className="h-4 w-4" />
                    {labels.downloadQr}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyUrl()}
                    className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? labels.copied : labels.copyLink}
                  </button>
                  <a
                    href={accessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {device === "mobile" ? labels.viewLink : labels.viewLinkTablet}
                  </a>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
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
    qrLink: string;
    qrTitle: (name: string) => string;
    qrHintMobile: string;
    qrHintTablet: string;
    downloadQr: string;
    qrLoading: string;
    qrFailed: string;
    qrNetworkError: string;
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
      <p className="mx-auto max-w-[7.25rem] text-center text-[10px] leading-snug text-amber-700" title={labels.invalidAssignment}>
        {labels.invalidAssignment}
      </p>
    );
  }

  if (access.kind === "missing-screen") {
    return (
      <p className="mx-auto max-w-[7.25rem] text-center text-[10px] leading-snug text-amber-700">
        {labels.missingScreen}{" "}
        <Link href="/dashboard/settings?tab=posts" className="font-semibold underline">
          →
        </Link>
      </p>
    );
  }

  const url = access.url;

  async function copy() {
    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }
    if (!copied) return;
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
    <div className="mx-auto flex w-[9.5rem] items-center justify-center gap-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          dashboardIconButtonClass("neutral"),
          "border-transparent btn-gradient text-white shadow-sm hover:opacity-95 hover:text-white",
        )}
        title={viewLabel}
      >
        <ExternalLink className="h-4 w-4" />
        <span className="sr-only">{viewLabel}</span>
      </a>
      <DashboardIconButton
        variant="neutral"
        disabled={busy}
        onClick={() => void copy()}
        label={copied ? labels.copied : labels.copyLink}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </DashboardIconButton>
      <StaffAccessQrButton
        venueId={venueId}
        memberId={member.id}
        memberName={member.name}
        memberToken={member.memberToken}
        device={access.kind === "pass" ? "tablet" : "mobile"}
        labels={labels}
        disabled={busy}
      />
      {access.kind === "waiter" ? (
        <DashboardIconButton
          variant="warning"
          disabled={busy || rotating}
          onClick={() => void rotate()}
          label={labels.rotateLink}
        >
          <RefreshCw className={cn("h-4 w-4", rotating && "animate-spin")} />
        </DashboardIconButton>
      ) : (
        <span className="inline-flex min-h-9 min-w-9 shrink-0" aria-hidden />
      )}
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
        <StaffAccessQrButton
          venueId={venueId}
          memberId={member.id}
          memberName={member.name}
          memberToken={member.memberToken}
          device={access.kind === "pass" ? "tablet" : "mobile"}
          labels={labels}
          disabled={busy}
        />
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
  const assignablePosts = useMemo(
    () => staffAssignableVenuePosts(opsConfig ?? undefined, langCode),
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
  const [postAssignment, setPostAssignment] = useState("all");
  const [jobRole, setJobRole] = useState<StaffJobRole>("waiter");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editZoneId, setEditZoneId] = useState("");
  const [editPostAssignment, setEditPostAssignment] = useState("all");
  const [editJobRole, setEditJobRole] = useState<StaffJobRole>("waiter");
  const [busy, setBusy] = useState<string | null>(null);
  const [screensByStation, setScreensByStation] = useState<StaffScreensByStation>({});
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const loadGenerationRef = useRef(0);
  const screenLoadGenerationRef = useRef(0);

  const invalidMembers = useMemo(
    () =>
      members.filter((member) => {
        if (member.stations.length === 0) return true;
        const primary = staffPrimaryAssignment(member.stations);
        return staffAssignmentLinkKind(primary, venuePosts) === "invalid";
      }),
    [members, venuePosts],
  );

  const venue = venues.find((v) => v.id === venueId);
  const zonesReady = !spotsLoading && zoneGroups.length > 0;
  const postsReady = !opsLoading;

  useEffect(() => {
    if (zoneGroups.length === 0) return;
    if (staffPostRequiresZoneAssignment(postAssignment, venuePosts) && !zoneId) {
      setZoneId("all");
    }
  }, [zoneGroups, postAssignment, zoneId, venuePosts]);

  function zoneLabel(id: string | null | undefined): string {
    if (!id || id === "all") return S.colSpaceAll;
    return zoneGroups.find((z) => z.id === id)?.label ?? id;
  }

  function zoneLabelForMember(member: StaffMember): string {
    const assignment = staffPrimaryAssignment(member.stations);
    if (!staffPostRequiresZoneAssignment(assignment, venuePosts)) return S.colSpaceAll;
    return zoneLabel(member.zoneId);
  }

  function messageScopeForPost(post: string): string | null {
    if (post === "services" || post === "all" || post === "pass-all") return null;
    const venuePost = venuePosts.find((row) => row.id === post);
    if (venuePost?.station === "services") return null;
    if (enabledPosts.some((row) => row.id === post)) return post;
    return null;
  }

  const postOptionsForRole = useCallback(
    (role: StaffJobRole) => staffPostOptionsForJobRole(role, assignablePosts, langCode),
    [assignablePosts, langCode],
  );

  const waiterPostOptions = useMemo(
    () => postOptionsForRole("waiter").filter((row) => row.id !== "all"),
    [postOptionsForRole],
  );

  const kdsPostOptions = useMemo(() => postOptionsForRole("pass"), [postOptionsForRole]);

  function applyJobRoleChange(
    role: StaffJobRole,
    setPost: (post: string) => void,
    setZone: (zone: string) => void,
    currentZone: string,
  ) {
    const options = staffPostOptionsForJobRole(role, assignablePosts, langCode);
    const nextPost = defaultStaffAssignmentForJobRole(role, assignablePosts) || options[0]?.id || "";
    setPost(nextPost);
    if (role === "waiter") {
      if (!currentZone) setZone("all");
    } else {
      setZone("");
    }
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
    if (staffPostRequiresZoneAssignment(postAssignment, venuePosts) && !zoneId) {
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
        setPostAssignment(defaultStaffAssignmentForJobRole("waiter", assignablePosts) || "all");
        setJobRole("waiter");
        setZoneId("");
        await reload();
        notifyLive360Updated();
      }
    } finally {
      setBusy(null);
    }
  }

  function assignmentForRole(role: StaffJobRole, assignment: string): string {
    const options = staffPostOptionsForJobRole(role, assignablePosts, langCode);
    if (options.some((option) => option.id === assignment)) return assignment;
    return defaultStaffAssignmentForJobRole(role, assignablePosts) || options[0]?.id || "";
  }

  function startEdit(member: StaffMember) {
    const assignment = staffPrimaryAssignment(member.stations);
    const role = staffJobRoleForAssignment(assignment, venuePosts);
    const resolvedRole: StaffJobRole = role === "invalid" ? "waiter" : role;
    const resolvedAssignment = assignmentForRole(resolvedRole, assignment);
    setEditingId(member.id);
    setEditName(member.name);
    setEditZoneId(
      staffPostRequiresZoneAssignment(resolvedAssignment, venuePosts)
        ? (member.zoneId ?? "all")
        : "",
    );
    setEditPostAssignment(resolvedAssignment);
    setEditJobRole(resolvedRole);
  }

  async function saveEdit(memberId: string) {
    if (!venueId) return;
    if (!editZoneId && staffPostRequiresZoneAssignment(editPostAssignment, venuePosts)) {
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
        notifyLive360Updated();
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
      if (res.ok) {
        await reload();
        notifyLive360Updated();
      }
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
    qrLink: S.qrLink,
    qrTitle: S.qrTitle,
    qrHintMobile: S.qrHintMobile,
    qrHintTablet: S.qrHintTablet,
    downloadQr: S.downloadQr,
    qrLoading: S.qrLoading,
    qrFailed: S.qrFailed,
    qrNetworkError: S.qrNetworkError,
  };
  const screenCopy = staffScreenCopyFromPersonnel(S);

  function renderAssignmentFields(
    values: {
      name: string;
      role: StaffJobRole;
      zone: string;
      post: string;
    },
    onChange: {
      setName: (v: string) => void;
      setRole: (v: StaffJobRole) => void;
      setZone: (v: string) => void;
      setPost: (v: string) => void;
    },
  ) {
    const chipsScope = messageScopeForPost(values.post);
    const postOptions = staffPostOptionsForJobRole(values.role, assignablePosts, langCode);
    const kdsUnavailable = values.role === "pass" && postOptions.length === 0;
    const waiterPostsMissing = values.role === "waiter" && waiterPostOptions.length === 0;
    const deviceLabel = staffDeviceLabelForContext(
      values.post,
      venuePosts,
      screenCopy,
      values.role,
    );
    const postHint = kdsUnavailable
      ? "kds-unavailable"
      : waiterPostsMissing && values.post !== "all"
        ? "waiter-missing"
        : chipsScope
          ? "tablet-scope"
          : values.post === "all"
            ? "all-scope"
            : values.role === "waiter"
              ? "waiter-scope"
              : "empty";
    return (
      <>
        <td className="px-3 py-2 align-top">
          <input
            value={values.name}
            onChange={(e) => onChange.setName(e.target.value)}
            maxLength={60}
            placeholder={S.namePlaceholder}
            className={`${dashboardFieldClass} w-full text-sm`}
          />
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={values.role}
            required
            onChange={(e) => {
              const next = e.target.value as StaffJobRole;
              onChange.setRole(next);
              applyJobRoleChange(next, onChange.setPost, onChange.setZone, values.zone);
            }}
            className={`${dashboardFieldClass} w-full text-sm`}
          >
            <option value="waiter">{S.jobRoleWaiter}</option>
            <option value="pass">{S.jobRolePass}</option>
          </select>
          <div className="mt-1.5 flex min-h-[2.5rem] flex-col gap-1">
            <ScreenDeviceLabel
              device={deviceLabel.device}
              labelMobile={deviceLabel.labelMobile}
              labelTablet={deviceLabel.labelTablet}
              hintMobile={deviceLabel.hintMobile}
              hintTablet={deviceLabel.hintTablet}
            />
            <p className="text-[10px] leading-snug text-slate-400">
              {deviceLabel.device === "mobile"
                ? deviceLabel.hintMobile
                : deviceLabel.hintTablet}
            </p>
          </div>
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={values.zone}
            onChange={(e) => onChange.setZone(e.target.value)}
            required={staffPostRequiresZoneAssignment(values.post, venuePosts)}
            disabled={values.role === "pass"}
            className={`${dashboardFieldClass} w-full text-sm disabled:opacity-60`}
          >
            {staffPostRequiresZoneAssignment(values.post, venuePosts) ? (
              <>
                <option value="" disabled>
                  {S.selectSpacePlaceholder}
                </option>
                <option value="all">{S.colSpaceAll}</option>
              </>
            ) : (
              <option value="">{S.colSpaceAll}</option>
            )}
            {zoneGroups.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.label}
              </option>
            ))}
          </select>
          <div className="mt-1 min-h-[2.5rem]" aria-hidden />
        </td>
        <td className="px-3 py-2 align-top">
          <select
            value={postOptions.some((option) => option.id === values.post) ? values.post : ""}
            required
            disabled={kdsUnavailable}
            onChange={(e) => {
              const next = e.target.value;
              onChange.setPost(next);
              if (staffPostRequiresZoneAssignment(next, venuePosts)) {
                if (!values.zone) onChange.setZone("all");
              } else {
                onChange.setZone("");
              }
            }}
            className={`${dashboardFieldClass} w-full text-sm disabled:opacity-60`}
          >
            {postOptions.length === 0 ? (
              <option value="">{S.noKdsPosts}</option>
            ) : (
              postOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))
            )}
          </select>
          <div className="mt-1 min-h-[2.5rem] text-[10px] leading-snug">
            {postHint === "kds-unavailable" ? (
              <p className="text-amber-700">
                {S.noKdsPosts}{" "}
                <Link href="/dashboard/settings?tab=posts" className="font-semibold underline">
                  →
                </Link>
              </p>
            ) : postHint === "waiter-missing" ? (
              <p className="text-amber-700">
                {S.noWaiterPosts}{" "}
                <Link href="/dashboard/settings?tab=posts" className="font-semibold underline">
                  →
                </Link>
              </p>
            ) : postHint === "tablet-scope" ? (
              <p className="font-medium text-slate-500">{S.messagesScopeTablet}</p>
            ) : postHint === "all-scope" ? (
              <p className="text-slate-400">{S.messagesScopeAll}</p>
            ) : postHint === "waiter-scope" ? (
              <p className="text-slate-400">{S.messagesScopeWaiter}</p>
            ) : (
              <span className="invisible select-none" aria-hidden>
                —
              </span>
            )}
          </div>
        </td>
      </>
    );
  }

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {invalidMembers.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {S.invalidStaffBanner(invalidMembers.length)}
        </div>
      ) : null}

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
          ) : staffPostRequiresZoneAssignment(postAssignment, venuePosts) && !zonesReady ? (
            <p className="text-sm text-slate-600">
              {S.noSpaces}{" "}
              <Link href="/dashboard/settings?tab=spaces" className="font-medium text-brand-blue hover:underline">
                {S.manageSpacesLink}
              </Link>
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[42rem] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[34%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5">{S.colName}</th>
                      <th className="px-3 py-2.5">{S.colRoleRequired}</th>
                      <th className="px-3 py-2.5">{S.colSpaceRequired}</th>
                      <th className="px-3 py-2.5">{S.colPostRequired}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      {renderAssignmentFields(
                        {
                          name,
                          role: jobRole,
                          zone: zoneId,
                          post: postAssignment,
                        },
                        {
                          setName,
                          setRole: setJobRole,
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
                    (staffPostRequiresZoneAssignment(postAssignment, venuePosts) && !zoneId) ||
                    (jobRole === "pass" && kdsPostOptions.length === 0) ||
                    !postAssignment
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
        <div className="mt-3 rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/90 to-blue-50/40 px-4 py-3">
          <p className="text-xs font-medium text-slate-600">{S.listDeviceLegend}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <ScreenDeviceLabel
              device="mobile"
              labelMobile={screenCopy.screenMobile}
              labelTablet={screenCopy.screenKds}
              hintMobile={screenCopy.screenMobileHint}
              hintTablet={screenCopy.screenKdsHint}
            />
            <ScreenDeviceLabel
              device="kds"
              labelMobile={screenCopy.screenMobile}
              labelTablet={screenCopy.screenKds}
              hintTablet={screenCopy.screenKdsHint}
            />
            <ScreenDeviceLabel
              device="kds"
              labelMobile={screenCopy.screenMobile}
              labelTablet={screenCopy.screenSupportTablet}
              hintTablet={screenCopy.screenSupportTabletHint}
            />
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">{S.loading}</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{S.empty}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/90">
              <table className="w-full min-w-[58rem] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-[12%] px-4 py-3">{S.colName}</th>
                    <th className="w-[11%] px-4 py-3">{S.colRole}</th>
                    <th className="w-[11%] px-4 py-3">{S.colSpace}</th>
                    <th className="min-w-[11rem] px-4 py-3">
                      <span className="block">{S.colPost}</span>
                      <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
                        {S.colPostHint}
                      </span>
                    </th>
                    <th className="w-[9.5rem] px-4 py-3 text-center">{S.colLink}</th>
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
                              role: editJobRole,
                              zone: editZoneId,
                              post: editPostAssignment,
                            },
                            {
                              setName: setEditName,
                              setRole: setEditJobRole,
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
                                  (staffPostRequiresZoneAssignment(editPostAssignment, venuePosts) &&
                                    !editZoneId) ||
                                  (editJobRole === "pass" && kdsPostOptions.length === 0) ||
                                  !editPostAssignment
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
                    const memberRole = staffJobRoleForAssignment(primaryPost, venuePosts);
                    const deviceLabel = staffDeviceLabelForContext(
                      primaryPost,
                      venuePosts,
                      screenCopy,
                      memberRole === "invalid" ? undefined : memberRole,
                    );
                    const assignmentInvalid =
                      member.stations.length === 0 ||
                      staffAssignmentLinkKind(primaryPost, venuePosts) === "invalid";

                    return (
                      <tr
                        key={member.id}
                        className={cn(
                          "border-b border-slate-50 last:border-0 hover:bg-slate-50/40",
                          assignmentInvalid && "bg-amber-50/80",
                        )}
                      >
                        <td className="px-4 py-3 align-middle font-medium text-brand-navy">
                          {member.name}
                        </td>
                        <td className="px-4 py-3 align-middle text-slate-600">
                          <p className="font-medium text-brand-navy">
                            {memberRole === "invalid"
                              ? "—"
                              : staffJobRoleLabel(memberRole, langCode)}
                          </p>
                          <ScreenDeviceLabel
                            device={deviceLabel.device}
                            labelMobile={deviceLabel.labelMobile}
                            labelTablet={deviceLabel.labelTablet}
                            hintMobile={deviceLabel.hintMobile}
                            hintTablet={deviceLabel.hintTablet}
                            className="mt-1"
                          />
                        </td>
                        <td className="px-4 py-3 align-middle text-slate-600">
                          {zoneLabelForMember(member)}
                        </td>
                        <td className="px-4 py-3 align-middle text-slate-600">
                          <div className="flex items-start gap-3">
                            <PostDeviceBadge
                              device={deviceLabel.device}
                              station={deviceLabel.station}
                              labelMobile={screenCopy.screenMobileHint}
                              labelTablet={screenCopy.screenKdsHint}
                              labelSupportTablet={screenCopy.screenSupportTabletHint}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-brand-navy">
                                {staffAssignmentLabelForLang(primaryPost, langCode, venuePosts)}
                              </p>
                              {postStationSubtitle ? (
                                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                                  {postStationSubtitle}
                                </p>
                              ) : null}
                              {chipsScope ? (
                                <StaffMessagesChips
                                  config={opsConfig}
                                  scopeId={chipsScope}
                                  langCode={langCode}
                                  compact
                                />
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-center">
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
                        <td className="px-4 py-3 align-middle text-center">
                          <div className="mx-auto inline-flex w-[4.75rem] items-center justify-center gap-1">
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
