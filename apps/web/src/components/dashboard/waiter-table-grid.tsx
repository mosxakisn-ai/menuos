"use client";

import { useMemo } from "react";
import {
  buildTableGridTiles,
  passStationDbToInput,
  type TableGridCall,
  type TableGridPassSignal,
  type TableGridSpot,
  type TableGridTile,
  type TableTileState,
} from "@menuos/shared";
import { TableGridLegend, TableGridPreview } from "@/components/dashboard/table-grid-preview";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

function formatTileHint(
  tile: TableGridTile,
  callTypeLabels: Record<string, string>,
  passStationLabels: Record<string, string>,
): string | undefined {
  if (tile.state === "idle") return undefined;

  const parts: string[] = [];

  if (tile.activeCalls.length > 0) {
    const call = tile.activeCalls[0]!;
    parts.push(callTypeLabels[call.type] ?? call.type);
  }

  if (tile.activePasses.length > 0) {
    const pass = tile.activePasses[0]!;
    const message = pass.message?.trim();
    if (message) {
      parts.push(message);
    } else {
      const stationKey = passStationDbToInput(pass.station);
      parts.push(passStationLabels[stationKey] ?? pass.station);
    }
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function WaiterTableGrid({
  spots,
  calls,
  passSignals,
}: {
  spots: TableGridSpot[];
  calls: TableGridCall[];
  passSignals: TableGridPassSignal[];
}) {
  const { d } = useDashboardCopy();
  const W = d.waiter;

  const tiles = useMemo(
    () => buildTableGridTiles(spots, calls, passSignals),
    [spots, calls, passSignals],
  );

  if (spots.length === 0) return null;

  const stateLabels = W.tableStateLabels as Record<TableTileState, string>;
  const previewTiles = tiles.map((tile) => ({
    id: tile.spotId,
    label: tile.label,
    state: tile.state,
    hint: formatTileHint(tile, W.callType, W.passStation),
  }));

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-brand-navy">{W.tableGridTitle}</h2>
      <TableGridLegend stateLabels={stateLabels} />
      <TableGridPreview tiles={previewTiles} stateLabels={stateLabels} />
    </div>
  );
}
