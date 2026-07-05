"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  enabledVenuePosts,
  listVenuePosts,
  quickChipsForPost,
  staffAssignmentLinkKind,
  staffPrimaryAssignment,
  stationScreenLabelMatchesPost,
  type PassStationInput,
} from "@menuos/shared";
import { dashboardCardClass } from "@/components/dashboard/dashboard-page";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { cn } from "@/lib/utils";

type StaffMemberRow = { id: string; stations: string[] };

const PASS_STATIONS: PassStationInput[] = ["kitchen", "bar", "cold", "dessert"];

export function Live360SetupChecklist({
  venueId,
  venues,
}: {
  venueId: string;
  venues: { id: string; name: string; slug: string }[];
}) {
  const { d, lang } = useDashboardCopy();
  const G = d.pages.settings.live360Guide;
  const langCode = lang === "EN" ? "EN" : "GR";
  const { spots, loading: spotsLoading } = useVenueSpots(venueId);
  const { config, loading: configLoading } = useVenueOperationsConfig(venueId);
  const [members, setMembers] = useState<StaffMemberRow[]>([]);
  const [screenLabels, setScreenLabels] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const posts = useMemo(
    () => listVenuePosts(config ?? undefined, langCode),
    [config, langCode],
  );
  const enabledPosts = useMemo(
    () => enabledVenuePosts(config ?? undefined, langCode),
    [config, langCode],
  );

  const loadMembers = useCallback(async () => {
    if (!venueId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members`);
      const data = (await res.json()) as { members?: StaffMemberRow[] };
      setMembers(res.ok ? (data.members ?? []) : []);
    } finally {
      setMembersLoading(false);
    }
  }, [venueId]);

  const loadScreens = useCallback(async () => {
    if (!venueId) {
      setScreenLabels([]);
      return;
    }
    const labels: string[] = [];
    await Promise.all(
      PASS_STATIONS.map(async (station) => {
        const res = await fetch(`/api/venues/${venueId}/station-screens?station=${station}`);
        const data = (await res.json()) as { screens?: { label: string; station?: string }[] };
        if (res.ok) {
          for (const row of data.screens ?? []) {
            labels.push(`${station}:${row.label.trim()}`);
          }
        }
      }),
    );
    setScreenLabels(labels);
  }, [venueId]);

  useEffect(() => {
    void loadMembers();
    void loadScreens();
  }, [loadMembers, loadScreens]);

  const invalidStaff = useMemo(
    () =>
      members.filter((member) => {
        if (member.stations.length === 0) return true;
        const primary = staffPrimaryAssignment(member.stations);
        return staffAssignmentLinkKind(primary, posts) === "invalid";
      }),
    [members, posts],
  );

  const tabletPosts = useMemo(
    () => enabledPosts.filter((post) => post.station !== undefined),
    [enabledPosts],
  );

  const screensReady = useMemo(() => {
    if (tabletPosts.length === 0) return false;
    return tabletPosts.every((post) =>
      screenLabels.some((key) => {
        const [station, label] = key.split(":");
        return (
          station === post.station &&
          stationScreenLabelMatchesPost(config ?? undefined, post.station, label, langCode)
        );
      }),
    );
  }, [tabletPosts, screenLabels, config, langCode]);

  const messagesReady = useMemo(
    () =>
      enabledPosts.some((post) => quickChipsForPost(config ?? undefined, post.id, langCode).length > 0),
    [config, enabledPosts, langCode],
  );

  const steps = useMemo(
    () => [
      {
        id: "spaces",
        done: spots.length > 0,
        href: "/dashboard/settings?tab=spaces",
        label: G.steps.spaces.label,
        hint: G.steps.spaces.hint,
      },
      {
        id: "posts",
        done: enabledPosts.length > 0,
        href: "/dashboard/settings?tab=posts",
        label: G.steps.posts.label,
        hint: G.steps.posts.hint,
      },
      {
        id: "messages",
        done: messagesReady,
        href: "/dashboard/settings?tab=messages",
        label: G.steps.messages.label,
        hint: G.steps.messages.hint,
      },
      {
        id: "screens",
        done: screensReady,
        href: "/dashboard/settings?tab=staff",
        label: G.steps.screens.label,
        hint: G.steps.screens.hint,
      },
      {
        id: "staff",
        done: members.length > 0 && invalidStaff.length === 0,
        href: "/dashboard/settings?tab=staff",
        label: G.steps.staff.label,
        hint: G.steps.staff.hint,
      },
    ],
    [G.steps, spots.length, enabledPosts.length, messagesReady, screensReady, members.length, invalidStaff.length],
  );

  const doneCount = steps.filter((step) => step.done).length;
  const allDone = doneCount === steps.length;
  const loading = spotsLoading || configLoading || membersLoading;

  if (!venueId || loading) return null;
  if (allDone) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold text-emerald-900">{G.allDone}</p>
        <Link href="/dashboard/waiter" className="mt-1 inline-flex text-sm font-semibold text-brand-blue hover:underline">
          {G.openScreens}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(dashboardCardClass, "border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.04] to-cyan-400/[0.06]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-navy">{G.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{G.subtitle}</p>
        </div>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand-navy">
          {G.progress(doneCount, steps.length)}
        </span>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition hover:border-brand-blue/30 hover:bg-white/60",
                step.done ? "border-emerald-200/80 bg-white/50" : "border-slate-200/80 bg-white/40",
              )}
            >
              {step.done ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-brand-navy">{step.label}</span>
                <span className="mt-0.5 block text-xs text-slate-600">{step.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {invalidStaff.length > 0 ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {G.invalidStaff(invalidStaff.length)}
        </p>
      ) : null}
    </div>
  );
}
