"use client";

import { Check } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  buildTableGridTiles,
  formatOrderLineDetail,
  formatWaiterCallLocationForLang,
  passStationDbToInput,
  passStationInputToDb,
  UNMAPPED_SPOT_ID_PREFIX,
  type TableGridCall,
  type TableGridPassSignal,
  type TableGridSpot,
  type TableGridTile,
  type TableTileState,
} from "@menuos/shared";
import {
  PASS_STATION_BADGE_STYLES,
  TABLE_TILE_BADGE_STYLES,
  TABLE_TILE_STYLES,
  TableGridLegend,
} from "@/components/dashboard/table-grid-preview";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MonitorViewTab = "all" | "calls" | "pass";
export type PassStationFilter = "all" | "kitchen" | "bar" | "cold" | "dessert";

function isOrderUpdated(call: TableGridCall): boolean {
  if (call.type !== "ORDER" || !call.createdAt || !call.updatedAt) return false;
  return new Date(call.updatedAt).getTime() - new Date(call.createdAt).getTime() > 1500;
}

function formatOrderSummary(call: TableGridCall): string | null {
  const lines = call.orderItems?.lines;
  if (!lines?.length) return null;
  const first = lines[0]!;
  const detail = formatOrderLineDetail(first);
  const head = `${first.quantity}× ${first.name}`;
  if (lines.length === 1) return detail ? `${head} (${detail})` : head;
  return `${head} +${lines.length - 1}`;
}

function tileDisplayLabel(tile: TableGridTile, lang: "GR" | "EN"): string {
  if (!tile.spotId.startsWith(UNMAPPED_SPOT_ID_PREFIX)) return tile.label;
  const sample = tile.activeCalls[0] ?? tile.activePasses[0];
  return sample ? formatWaiterCallLocationForLang(sample, lang) : tile.label;
}

function isUnmappedTile(tile: TableGridTile): boolean {
  return tile.spotId.startsWith(UNMAPPED_SPOT_ID_PREFIX);
}

function filterPasses(
  passes: TableGridPassSignal[],
  passStationFilter: PassStationFilter,
): TableGridPassSignal[] {
  if (passStationFilter === "all") return passes;
  const dbStation = passStationInputToDb(passStationFilter);
  return passes.filter((pass) => pass.station === dbStation);
}

function TileStateBadge({
  state,
  label,
  className,
}: {
  state: TableTileState;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight",
        TABLE_TILE_BADGE_STYLES[state],
        className,
      )}
    >
      {label}
    </span>
  );
}

function WaiterSpotTile({
  tile,
  viewTab,
  passStationFilter,
  callTypeLabels,
  passReadyLabels,
  callStatusLabels,
  stateLabels,
  labels,
  lang,
  updatingCallId,
  updatingPassId,
  onUpdateCall,
  onUpdatePass,
}: {
  tile: TableGridTile;
  viewTab: MonitorViewTab;
  passStationFilter: PassStationFilter;
  callTypeLabels: Record<string, string>;
  passReadyLabels: Record<string, string>;
  callStatusLabels: Record<string, string>;
  stateLabels: Record<TableTileState, string>;
  labels: {
    goButton: string;
    completeButton: string;
    passPickedUp: string;
    passDelivered: string;
    newItems: string;
    orderTotal: string;
    guestCall: string;
    unmappedSpotBadge: string;
  };
  lang: "GR" | "EN";
  updatingCallId: string | null;
  updatingPassId: string | null;
  onUpdateCall: (callId: string, status: "ACKNOWLEDGED" | "COMPLETED") => void;
  onUpdatePass: (signalId: string, status: "PICKED_UP" | "DELIVERED") => void;
}) {
  const visibleCalls = viewTab === "pass" ? [] : tile.activeCalls;
  const visiblePasses =
    viewTab === "calls"
      ? []
      : passStationFilter === "all"
        ? tile.activePasses
        : filterPasses(tile.activePasses, passStationFilter);
  const hasActivity = visibleCalls.length > 0 || visiblePasses.length > 0;
  const displayLabel = tileDisplayLabel(tile, lang);
  const unmapped = isUnmappedTile(tile);

  return (
    <div
      className={cn(
        "flex h-full min-h-[14rem] flex-col rounded-xl border p-3 shadow-sm transition",
        TABLE_TILE_STYLES[tile.state],
      )}
    >
      {hasActivity ? (
        <>
          <div className="flex w-full shrink-0 items-start justify-between gap-2">
            <span
              className={cn(
                "font-serif text-2xl font-bold tabular-nums leading-none",
                unmapped ? "text-left text-lg leading-tight" : "",
              )}
            >
              {displayLabel}
            </span>
            <div className="flex shrink flex-col items-end gap-1 text-right">
              {unmapped ? (
                <span className="inline-flex max-w-full rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                  {labels.unmappedSpotBadge}
                </span>
              ) : null}
              <TileStateBadge state={tile.state} label={stateLabels[tile.state]} className="text-right" />
            </div>
          </div>
          <div className="mt-2.5 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {visibleCalls.map((call, index) => (
            <div
              key={call.id ?? `call-${index}`}
              className="rounded-lg border border-blue-200/80 bg-white/70 p-2"
            >
              <TileStateBadge state="guest_call" label={callTypeLabels[call.type] ?? labels.guestCall} />
              {isOrderUpdated(call) && call.status === "PENDING" ? (
                <span className="ml-1 inline-flex rounded bg-amber-200 px-1.5 py-px text-[9px] font-bold uppercase text-amber-900">
                  {labels.newItems}
                </span>
              ) : null}
              {call.type === "ORDER" && call.orderItems?.lines?.length ? (
                <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-slate-700">
                  {formatOrderSummary(call)}
                  {call.orderItems.total ? ` · €${call.orderItems.total}` : null}
                </p>
              ) : null}
              {call.status === "ACKNOWLEDGED" ? (
                <p className="mt-1 text-[10px] text-slate-500">
                  {callStatusLabels[call.status] ?? call.status}
                </p>
              ) : null}
              {call.id ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {call.status === "PENDING" ? (
                    <button
                      type="button"
                      disabled={updatingCallId !== null}
                      onClick={() => onUpdateCall(call.id!, "ACKNOWLEDGED")}
                      className={cn(buttonClass("primary", "sm"), "min-h-8 px-2.5 py-1 text-[11px]")}
                    >
                      {labels.goButton}
                    </button>
                  ) : null}
                  {call.status !== "COMPLETED" ? (
                    <button
                      type="button"
                      disabled={updatingCallId !== null}
                      onClick={() => onUpdateCall(call.id!, "COMPLETED")}
                      className={cn(
                        buttonClass("secondary", "sm"),
                        "inline-flex min-h-8 items-center gap-0.5 px-2.5 py-1 text-[11px]",
                      )}
                    >
                      <Check className="h-3 w-3" />
                      {labels.completeButton}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}

          {visiblePasses.map((pass, index) => {
            const stationKey = passStationDbToInput(pass.station);
            const readyLabel =
              passReadyLabels[stationKey as keyof typeof passReadyLabels] ??
              passReadyLabels.kitchen;
            const badgeStyle =
              PASS_STATION_BADGE_STYLES[stationKey] ?? PASS_STATION_BADGE_STYLES.kitchen;
            const message = pass.message?.trim();

            return (
              <div
                key={pass.id ?? `pass-${index}`}
                className="rounded-lg border border-black/5 bg-white/70 p-2"
              >
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight",
                    badgeStyle,
                  )}
                >
                  {readyLabel}
                </span>
                {message ? (
                  <p className="mt-1.5 line-clamp-3 text-[11px] font-medium leading-snug text-slate-700">
                    {message}
                  </p>
                ) : null}
                {pass.id ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pass.status === "READY" ? (
                      <button
                        type="button"
                        disabled={updatingPassId !== null}
                        onClick={() => onUpdatePass(pass.id!, "PICKED_UP")}
                        className={cn(buttonClass("secondary", "sm"), "min-h-8 px-2.5 py-1 text-[11px]")}
                      >
                        {labels.passPickedUp}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={updatingPassId !== null}
                      onClick={() => onUpdatePass(pass.id!, "DELIVERED")}
                      className={cn(
                        buttonClass("primary", "sm"),
                        "inline-flex min-h-8 items-center gap-0.5 px-2.5 py-1 text-[11px]",
                      )}
                    >
                      <Check className="h-3 w-3" />
                      {labels.passDelivered}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <span className="font-serif text-2xl font-bold tabular-nums leading-none">{displayLabel}</span>
          {unmapped ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              {labels.unmappedSpotBadge}
            </span>
          ) : null}
          <TileStateBadge state={tile.state} label={stateLabels[tile.state]} />
        </div>
      )}
    </div>
  );
}

function tileMatchesView(
  tile: TableGridTile,
  viewTab: MonitorViewTab,
  passStationFilter: PassStationFilter,
): boolean {
  if (viewTab === "all") {
    if (passStationFilter === "all") return true;
    return (
      tile.activeCalls.length > 0 ||
      filterPasses(tile.activePasses, passStationFilter).length > 0
    );
  }
  if (viewTab === "calls") return tile.activeCalls.length > 0;
  return filterPasses(tile.activePasses, passStationFilter).length > 0;
}

export function WaiterTableGrid({
  spots,
  calls,
  passSignals,
  viewTab,
  passStationFilter,
  updatingCallId,
  updatingPassId,
  onUpdateCall,
  onUpdatePass,
  legendEnd,
  stateLabels: stateLabelsProp,
  passReadyLabels: passReadyLabelsProp,
}: {
  spots: TableGridSpot[];
  calls: TableGridCall[];
  passSignals: TableGridPassSignal[];
  viewTab: MonitorViewTab;
  passStationFilter: PassStationFilter;
  updatingCallId: string | null;
  updatingPassId: string | null;
  onUpdateCall: (callId: string, status: "ACKNOWLEDGED" | "COMPLETED") => void;
  onUpdatePass: (signalId: string, status: "PICKED_UP" | "DELIVERED") => void;
  legendEnd?: ReactNode;
  stateLabels?: Record<TableTileState, string>;
  passReadyLabels?: Record<string, string>;
}) {
  const { d, lang } = useDashboardCopy();
  const W = d.waiter;
  const passReadyLabels = passReadyLabelsProp ?? (W.passReadyLabel as Record<string, string>);

  const tiles = useMemo(() => {
    const built = buildTableGridTiles(spots, calls, passSignals);
    return built.filter((tile) => tileMatchesView(tile, viewTab, passStationFilter));
  }, [spots, calls, passSignals, viewTab, passStationFilter]);

  const hasConfiguredSpots = spots.length > 0;
  const hasAnyTiles = useMemo(
    () => buildTableGridTiles(spots, calls, passSignals).length > 0,
    [spots, calls, passSignals],
  );

  if (!hasConfiguredSpots && !hasAnyTiles) return null;

  const stateLabels = stateLabelsProp ?? (W.tableStateLabels as Record<TableTileState, string>);
  const emptyMessage =
    viewTab === "calls"
      ? W.emptyCallsTab
      : viewTab === "pass"
        ? W.emptyPassTab
        : passStationFilter !== "all"
          ? W.emptyFilteredView
          : null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-brand-navy">{W.tableGridTitle}</h2>
      {hasConfiguredSpots ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <TableGridLegend stateLabels={stateLabels} compact className="min-w-0 flex-1" />
          {legendEnd ? (
            <div className="ml-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right">
              {legendEnd}
            </div>
          ) : null}
        </div>
      ) : null}
      <p className={cn("text-xs leading-relaxed text-slate-500", !hasConfiguredSpots && "hidden")}>
        {W.tableGridLegendHint} {W.tableGridLegendAutoNote}
      </p>
      {tiles.length === 0 && emptyMessage ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <WaiterSpotTile
              key={tile.spotId}
              tile={tile}
              viewTab={viewTab}
              passStationFilter={passStationFilter}
              callTypeLabels={W.callType}
              passReadyLabels={passReadyLabels}
              callStatusLabels={W.callStatus}
              stateLabels={stateLabels}
              labels={{
                goButton: W.goButton,
                completeButton: W.completeButton,
                passPickedUp: W.passPickedUp,
                passDelivered: W.passDelivered,
                newItems: W.newItems,
                orderTotal: W.orderTotal,
                guestCall: stateLabels.guest_call,
                unmappedSpotBadge: W.unmappedSpotBadge,
              }}
              lang={lang}
              updatingCallId={updatingCallId}
              updatingPassId={updatingPassId}
              onUpdateCall={onUpdateCall}
              onUpdatePass={onUpdatePass}
            />
          ))}
        </div>
      )}
    </div>
  );
}
