"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";
import {
  buildTableGridTiles,
  formatOrderLineDetail,
  passStationDbToInput,
  type TableGridCall,
  type TableGridPassSignal,
  type TableGridSpot,
  type TableGridTile,
  type TableTileState,
} from "@menuos/shared";
import { TableGridLegend, TABLE_TILE_STYLES } from "@/components/dashboard/table-grid-preview";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function WaiterSpotTile({
  tile,
  callTypeLabels,
  passStationLabels,
  callStatusLabels,
  labels,
  updatingCallId,
  updatingPassId,
  onUpdateCall,
  onUpdatePass,
}: {
  tile: TableGridTile;
  callTypeLabels: Record<string, string>;
  passStationLabels: Record<string, string>;
  callStatusLabels: Record<string, string>;
  labels: {
    goButton: string;
    completeButton: string;
    passPickedUp: string;
    passDelivered: string;
    newItems: string;
    orderTotal: string;
  };
  updatingCallId: string | null;
  updatingPassId: string | null;
  onUpdateCall: (callId: string, status: "ACKNOWLEDGED" | "COMPLETED") => void;
  onUpdatePass: (signalId: string, status: "PICKED_UP" | "DELIVERED") => void;
}) {
  const hasActivity = tile.activeCalls.length > 0 || tile.activePasses.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-2 shadow-sm transition",
        TABLE_TILE_STYLES[tile.state],
        hasActivity ? "min-h-[9.5rem]" : "aspect-square items-center justify-center text-center",
      )}
    >
      <span
        className={cn(
          "font-serif text-xl font-bold tabular-nums",
          hasActivity ? "shrink-0" : "",
        )}
      >
        {tile.label}
      </span>

      {hasActivity ? (
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {tile.activeCalls.map((call, index) => (
            <div
              key={call.id ?? `call-${index}`}
              className="rounded-lg border border-black/5 bg-white/60 p-1.5"
            >
              <p className="text-[10px] font-semibold leading-tight">
                {callTypeLabels[call.type] ?? call.type}
                {isOrderUpdated(call) && call.status === "PENDING" ? (
                  <span className="ml-1 rounded bg-amber-200 px-1 py-px text-[8px] font-bold uppercase text-amber-900">
                    {labels.newItems}
                  </span>
                ) : null}
              </p>
              {call.type === "ORDER" && call.orderItems?.lines?.length ? (
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-tight text-slate-600">
                  {formatOrderSummary(call)}
                  {call.orderItems.total ? ` · €${call.orderItems.total}` : null}
                </p>
              ) : null}
              {call.status === "ACKNOWLEDGED" ? (
                <p className="mt-0.5 text-[9px] text-slate-500">
                  {callStatusLabels[call.status] ?? call.status}
                </p>
              ) : null}
              {call.id ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {call.status === "PENDING" ? (
                    <button
                      type="button"
                      disabled={updatingCallId !== null}
                      onClick={() => onUpdateCall(call.id!, "ACKNOWLEDGED")}
                      className={cn(buttonClass("primary", "sm"), "min-h-7 px-2 py-1 text-[10px]")}
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
                        "inline-flex min-h-7 items-center gap-0.5 px-2 py-1 text-[10px]",
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

          {tile.activePasses.map((pass, index) => {
            const stationKey = passStationDbToInput(pass.station);
            const baseStationLabel =
              passStationLabels[stationKey as keyof typeof passStationLabels] ?? pass.station;
            const stationLabel = pass.stationScreenLabel?.trim()
              ? `${baseStationLabel} (${pass.stationScreenLabel.trim()})`
              : baseStationLabel;
            const detail = pass.message?.trim() || stationLabel;

            return (
              <div
                key={pass.id ?? `pass-${index}`}
                className="rounded-lg border border-black/5 bg-white/60 p-1.5"
              >
                <p className="line-clamp-2 text-[10px] font-semibold leading-tight">{detail}</p>
                {pass.id ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {pass.status === "READY" ? (
                      <button
                        type="button"
                        disabled={updatingPassId !== null}
                        onClick={() => onUpdatePass(pass.id!, "PICKED_UP")}
                        className={cn(buttonClass("secondary", "sm"), "min-h-7 px-2 py-1 text-[10px]")}
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
                        "inline-flex min-h-7 items-center gap-0.5 px-2 py-1 text-[10px]",
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
      ) : null}
    </div>
  );
}

export function WaiterTableGrid({
  spots,
  calls,
  passSignals,
  updatingCallId,
  updatingPassId,
  onUpdateCall,
  onUpdatePass,
}: {
  spots: TableGridSpot[];
  calls: TableGridCall[];
  passSignals: TableGridPassSignal[];
  updatingCallId: string | null;
  updatingPassId: string | null;
  onUpdateCall: (callId: string, status: "ACKNOWLEDGED" | "COMPLETED") => void;
  onUpdatePass: (signalId: string, status: "PICKED_UP" | "DELIVERED") => void;
}) {
  const { d } = useDashboardCopy();
  const W = d.waiter;

  const tiles = useMemo(
    () => buildTableGridTiles(spots, calls, passSignals),
    [spots, calls, passSignals],
  );

  if (spots.length === 0) return null;

  const stateLabels = W.tableStateLabels as Record<TableTileState, string>;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-brand-navy">{W.tableGridTitle}</h2>
      <TableGridLegend stateLabels={stateLabels} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tiles.map((tile) => (
          <WaiterSpotTile
            key={tile.spotId}
            tile={tile}
            callTypeLabels={W.callType}
            passStationLabels={W.passStation}
            callStatusLabels={W.callStatus}
            labels={{
              goButton: W.goButton,
              completeButton: W.completeButton,
              passPickedUp: W.passPickedUp,
              passDelivered: W.passDelivered,
              newItems: W.newItems,
              orderTotal: W.orderTotal,
            }}
            updatingCallId={updatingCallId}
            updatingPassId={updatingPassId}
            onUpdateCall={onUpdateCall}
            onUpdatePass={onUpdatePass}
          />
        ))}
      </div>
    </div>
  );
}
