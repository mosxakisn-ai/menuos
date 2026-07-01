"use client";

import { cn } from "@/lib/utils";
import type { DemoTableTile } from "@/content/settings-demo";

const TILE_STYLES: Record<DemoTableTile["state"], string> = {
  idle: "border-slate-200 bg-white text-slate-600",
  guest_call: "border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-200",
  kitchen_ready: "border-orange-400 bg-orange-50 text-orange-900 ring-2 ring-orange-200",
  bar_ready: "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200",
  both: "border-violet-400 bg-violet-50 text-violet-900 ring-2 ring-violet-200",
};

export function TableGridPreview({
  tiles,
  stateLabels,
  className,
}: {
  tiles: DemoTableTile[];
  stateLabels: Record<DemoTableTile["state"], string>;
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
            TILE_STYLES[tile.state],
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
