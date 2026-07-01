"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

type Venue = { id: string; name: string };
type StaffMember = {
  id: string;
  name: string;
  roleLabel: string;
  stations: string[];
};

export function VenueStaffSetup({ venues }: { venues: Venue[] }) {
  const { d, lang } = useDashboardCopy();
  const S = d.pages.settings.personnel;
  const spotLang = lang === "EN" ? "EN" : "GR";
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

  const venue = venues.find((v) => v.id === venueId);

  const reload = useCallback(async () => {
    if (!venueId) {
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/staff-members`);
      const data = await res.json();
      setMembers(res.ok ? (data.members ?? []) : []);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    if (venues.length && !venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function toggleStation(
    current: StaffStationOption[],
    station: StaffStationOption,
  ): StaffStationOption[] {
    if (station === "all") {
      return current.includes("all") ? [] : ["all"];
    }
    const withoutAll = current.filter((s) => s !== "all");
    if (withoutAll.includes(station)) {
      const next = withoutAll.filter((s) => s !== station);
      return next.length > 0 ? next : ["services"];
    }
    return [...withoutAll, station];
  }

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

  function StationPicker({
    value,
    onChange,
  }: {
    value: StaffStationOption[];
    onChange: (next: StaffStationOption[]) => void;
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
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selected
                  ? "border-brand-blue bg-blue-50 text-brand-blue"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {S.stationLabels[station]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={dashboardCardClass}>
        <h2 className="text-sm font-semibold text-primary">{S.title}</h2>
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

        <form onSubmit={(e) => void addMember(e)} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{S.addTitle}</p>
          <div className={dashboardFormGridClass}>
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
          <div>
            <span className={dashboardLabelClass}>{S.colStations}</span>
            <div className="mt-2">
              <StationPicker value={stations} onChange={setStations} />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy !== null || !name.trim() || !roleLabel.trim()}
            className={`inline-flex items-center gap-1 ${buttonClass("primary", "md")}`}
          >
            <Plus className="h-4 w-4" />
            {busy === "add" ? S.saving : S.addStaff}
          </button>
        </form>
      </div>

      <div className={dashboardCardClass}>
        {loading ? (
          <p className="text-sm text-slate-500">{S.loading}</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-slate-500">{S.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 pr-4 font-medium">{S.colName}</th>
                  <th className="pb-3 pr-4 font-medium">{S.colRole}</th>
                  <th className="pb-3 pr-4 font-medium">{S.colStations}</th>
                  <th className="pb-3 font-medium">{S.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((member) =>
                  editingId === member.id ? (
                    <tr key={member.id}>
                      <td className="py-3 pr-4">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={60}
                          className={dashboardFieldClass}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          maxLength={40}
                          className={dashboardFieldClass}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <StationPicker value={editStations} onChange={setEditStations} />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void saveEdit(member.id)}
                            className={buttonClass("primary", "sm")}
                          >
                            {S.saveEdit}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className={buttonClass("secondary", "sm")}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={member.id}>
                      <td className="py-3 pr-4 font-medium text-brand-navy">{member.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{member.roleLabel}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatStaffStationsForLang(member.stations, spotLang)}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => startEdit(member)}
                            className={buttonClass("secondary", "sm")}
                            aria-label={S.edit}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void removeMember(member.id, member.name)}
                            className={buttonClass("secondary", "sm")}
                            aria-label={S.delete}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
