"use client";

import type { TableTileState } from "@menuos/shared";
import { cn } from "@/lib/utils";
import type { DemoTableTile } from "@/content/settings-demo";

export type { TableTileState };

export const TABLE_TILE_STYLES: Record<TableTileState, string> = {
  idle: "border-slate-200 bg-white text-slate-600",
  guest_call: "border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-200",
  kitchen_ready: "border-orange-400 bg-orange-50 text-orange-900 ring-2 ring-orange-200",
  cold_ready: "border-sky-400 bg-sky-50 text-sky-900 ring-2 ring-sky-200",
  bar_ready: "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200",
  both: "border-violet-400 bg-violet-50 text-violet-900 ring-2 ring-violet-200",
};

/** Compact badge on live grid tiles — matches tile border colors. */
export const TABLE_TILE_BADGE_STYLES: Record<TableTileState, string> = {
  idle: "bg-slate-100 text-slate-600",
  guest_call: "bg-blue-100 text-blue-900",
  kitchen_ready: "bg-orange-100 text-orange-900",
  cold_ready: "bg-sky-100 text-sky-900",
  bar_ready: "bg-emerald-100 text-emerald-900",
  both: "bg-violet-100 text-violet-900",
};

export const PASS_STATION_BADGE_STYLES: Record<string, string> = {
  kitchen: "bg-orange-100 text-orange-900",
  cold: "bg-sky-100 text-sky-900",
  bar: "bg-emerald-100 text-emerald-900",
  dessert: "bg-emerald-100 text-emerald-900",
};

const LEGEND_STATES: TableTileState[] = [
  "idle",
  "guest_call",
  "kitchen_ready",
  "cold_ready",
  "bar_ready",
  "both",
];

export function TableGridLegend({
  stateLabels,
  states = LEGEND_STATES,
  className,
  compact = false,
}: {
  stateLabels: Record<TableTileState, string>;
  states?: readonly TableTileState[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5 sm:gap-2", className)}>
      {states.map((state) => (
        <li key={state}>
          <span
            className={cn(
              "inline-flex items-center rounded-full font-semibold leading-tight",
              compact ? "px-1.5 py-px text-[10px] sm:px-2 sm:py-0.5 sm:text-xs" : "px-2.5 py-0.5 text-xs",
              TABLE_TILE_BADGE_STYLES[state],
            )}
          >
            {stateLabels[state]}
          </span>
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
        "grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {tiles.map((tile) => (
        <div
          key={tile.id ?? tile.label}
          className={cn(
            "flex h-full min-h-[14rem] flex-col items-center justify-center rounded-xl border p-2 text-center shadow-sm transition",
            TABLE_TILE_STYLES[tile.state],
          )}
        >
          <span className="font-serif text-xl font-bold tabular-nums">{tile.label}</span>
          <span
            className={cn(
              "mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
              TABLE_TILE_BADGE_STYLES[tile.state],
            )}
          >
            {stateLabels[tile.state]}
          </span>
        </div>
      ))}
    </div>
  );
}
