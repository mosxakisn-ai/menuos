"use client";

import { Check } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  buildTableGridTiles,
  formatOrderLineDetail,
  formatWaiterCallLocationForLang,
  UNMAPPED_SPOT_ID_PREFIX,
  type TableGridCall,
  type TableGridSpot,
  type TableGridTile,
  type TableTileState,
} from "@menuos/shared";
import { TABLE_TILE_BADGE_STYLES, TABLE_TILE_STYLES } from "@/components/dashboard/table-grid-preview";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MonitorViewTab = "all" | "calls";

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
  const sample = tile.activeCalls[0];
  return sample ? formatWaiterCallLocationForLang(sample, lang) : tile.label;
}

function isUnmappedTile(tile: TableGridTile): boolean {
  return tile.spotId.startsWith(UNMAPPED_SPOT_ID_PREFIX);
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
  callTypeLabels,
  callStatusLabels,
  stateLabels,
  labels,
  lang,
  updatingCallId,
  onUpdateCall,
}: {
  tile: TableGridTile;
  callTypeLabels: Record<string, string>;
  callStatusLabels: Record<string, string>;
  stateLabels: Record<TableTileState, string>;
  labels: {
    goButton: string;
    completeButton: string;
    newItems: string;
    guestCall: string;
    unmappedSpotBadge: string;
  };
  lang: "GR" | "EN";
  updatingCallId: string | null;
  onUpdateCall: (callId: string, status: "ACKNOWLEDGED" | "COMPLETED") => void;
}) {
  const visibleCalls = tile.activeCalls;
  const hasActivity = visibleCalls.length > 0;
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

function tileMatchesView(tile: TableGridTile, viewTab: MonitorViewTab): boolean {
  if (viewTab === "calls") return tile.activeCalls.length > 0;
  return true;
}

export function WaiterTableGrid({
  spots,
  calls,
  viewTab,
  updatingCallId,
  onUpdateCall,
  legendEnd,
  stateLabels: stateLabelsProp,
}: {
  spots: TableGridSpot[];
  calls: TableGridCall[];
  viewTab: MonitorViewTab;
  updatingCallId: string | null;
  onUpdateCall: (callId: string, status: "ACKNOWLEDGED" | "COMPLETED") => void;
  legendEnd?: ReactNode;
  stateLabels?: Record<TableTileState, string>;
}) {
  const { d, lang } = useDashboardCopy();
  const W = d.waiter;

  const tiles = useMemo(() => {
    const built = buildTableGridTiles(spots, calls, []);
    return built.filter((tile) => tileMatchesView(tile, viewTab));
  }, [spots, calls, viewTab]);

  const hasConfiguredSpots = spots.length > 0;
  const hasAnyTiles = useMemo(
    () => buildTableGridTiles(spots, calls, []).length > 0,
    [spots, calls],
  );

  if (!hasConfiguredSpots && !hasAnyTiles) return null;

  const stateLabels = stateLabelsProp ?? (W.tableStateLabels as Record<TableTileState, string>);
  const emptyMessage = viewTab === "calls" ? W.emptyCallsTab : null;

  return (
    <div className="space-y-3">
      {legendEnd ? (
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right">
          {legendEnd}
        </div>
      ) : null}
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
              callTypeLabels={W.callType}
              callStatusLabels={W.callStatus}
              stateLabels={stateLabels}
              labels={{
                goButton: W.goButton,
                completeButton: W.completeButton,
                newItems: W.newItems,
                guestCall: stateLabels.guest_call,
                unmappedSpotBadge: W.unmappedSpotBadge,
              }}
              lang={lang}
              updatingCallId={updatingCallId}
              onUpdateCall={onUpdateCall}
            />
          ))}
        </div>
      )}
    </div>
  );
}
