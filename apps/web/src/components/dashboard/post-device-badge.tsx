"use client";

import { Smartphone, Tablet } from "lucide-react";
import {
  isVenueSupportPostStation,
  type VenuePostStationInput,
} from "@menuos/shared";
import { cn } from "@/lib/utils";

export type PostDeviceKind = "mobile" | "kds" | "invalid";

export function postDeviceForStation(station: VenuePostStationInput): "mobile" | "kds" {
  return station === "services" ? "mobile" : "kds";
}

export function PostDeviceBadge({
  device,
  station,
  size = "md",
  showLabel = false,
  labelMobile,
  labelTablet,
  labelSupportTablet,
}: {
  device?: PostDeviceKind;
  station?: VenuePostStationInput;
  size?: "sm" | "md";
  showLabel?: boolean;
  labelMobile: string;
  labelTablet: string;
  /** Support posts (dishwash/cleaning/general) — optional override for tooltip. */
  labelSupportTablet?: string;
}) {
  const resolved: PostDeviceKind =
    device ?? (station ? postDeviceForStation(station) : "invalid");

  if (resolved === "invalid") {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200/80",
          size === "sm" ? "h-7 w-7" : "h-9 w-9",
        )}
        aria-hidden
      >
        <span className="text-xs text-slate-400">—</span>
      </span>
    );
  }

  const isMobile = resolved === "mobile";
  const Icon = isMobile ? Smartphone : Tablet;
  const tabletLabel =
    station && isVenueSupportPostStation(station) && labelSupportTablet
      ? labelSupportTablet
      : labelTablet;
  const label = isMobile ? labelMobile : tabletLabel;
  const boxClass = size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const badge = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center shadow-sm ring-1 ring-inset",
        boxClass,
        isMobile
          ? "bg-gradient-to-br from-blue-50 via-white to-cyan-100/90 text-[#2563EB] ring-blue-200/80 shadow-blue-500/10"
          : "bg-gradient-to-br from-cyan-50 via-white to-teal-100/80 text-[#0891B2] ring-cyan-200/80 shadow-cyan-500/10",
      )}
      title={label}
      aria-label={label}
    >
      <Icon className={iconClass} strokeWidth={2.25} />
    </span>
  );

  if (!showLabel) return badge;

  return (
    <span className="inline-flex items-center gap-2">
      {badge}
      <span className="text-xs text-slate-600">{label}</span>
    </span>
  );
}
