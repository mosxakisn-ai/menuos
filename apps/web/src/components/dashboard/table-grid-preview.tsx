"use client";

import { cn } from "@/lib/utils";
import type { DemoTableTile } from "@/content/settings-demo";

export type TableTileState = DemoTableTile["state"];

export const TABLE_TILE_STYLES: Record<TableTileState, string> = {
  idle: "border-slate-200 bg-white text-slate-600",
  guest_call: "border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-200",
  kitchen_ready: "border-orange-400 bg-orange-50 text-orange-900 ring-2 ring-orange-200",
  bar_ready: "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200",
  both: "border-violet-400 bg-violet-50 text-violet-900 ring-2 ring-violet-200",
};

const LEGEND_STATES: TableTileState[] = [
  "idle",
  "guest_call",
  "kitchen_ready",
  "bar_ready",
  "both",
];

export function TableGridLegend({
  stateLabels,
  className,
}: {
  stateLabels: Record<TableTileState, string>;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}>
      {LEGEND_STATES.map((state) => (
        <li key={state} className="inline-flex items-center gap-2 text-xs text-slate-600">
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 shrink-0 rounded border",
              TABLE_TILE_STYLES[state],
            )}
            aria-hidden
          />
          <span>{stateLabels[state]}</span>
        </li>
      ))}
    </ul>
  );
}

export function TableGridPreview({
  tiles,
  stateLabels,
  className,
}: {
  tiles: DemoTableTile[];
  stateLabels: Record<TableTileState, string>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6",
        className,
      )}
    >
      {tiles.map((tile) => (
        <div
          key={tile.id ?? tile.label}
          title={stateLabels[tile.state]}
          className={cn(
            "flex aspect-square flex-col items-center justify-center rounded-xl border p-2 text-center shadow-sm transition",
            TABLE_TILE_STYLES[tile.state],
          )}
        >
          <span className="font-serif text-xl font-bold tabular-nums">{tile.label}</span>
          {tile.hint ? (
            <span className="mt-1 line-clamp-2 text-[10px] font-medium leading-tight opacity-90">
              {tile.hint}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
