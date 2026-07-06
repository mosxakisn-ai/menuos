"use client";

import { Smartphone, Tablet } from "lucide-react";
import {
  isVenueSupportPostStation,
  type VenuePostStationInput,
} from "@menuos/shared";
import { cn } from "@/lib/utils";

export type PostDeviceKind = "mobile" | "kds" | "invalid";

const DEVICE_PILL_STYLES = {
  mobile: "bg-blue-100 text-blue-800 ring-blue-300/70",
  kds: "bg-teal-100 text-teal-900 ring-teal-300/70",
} as const;

export function postDeviceForStation(station: VenuePostStationInput): "mobile" | "kds" {
  return station === "services" ? "mobile" : "kds";
}

/** Colored pill — «Κινητό» vs «Tablet πάσου» at a glance in staff lists. */
export function ScreenDeviceLabel({
  device,
  labelMobile,
  labelTablet,
  hintMobile,
  hintTablet,
  size = "sm",
  className,
}: {
  device: PostDeviceKind;
  labelMobile: string;
  labelTablet: string;
  hintMobile?: string;
  hintTablet?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const pad = size === "sm" ? "gap-1 px-2 py-0.5" : "gap-1.5 px-2.5 py-1";

  if (device === "invalid") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-semibold leading-tight text-slate-500 ring-1 ring-inset ring-slate-200",
          textSize,
          className,
        )}
        aria-label="—"
      >
        —
      </span>
    );
  }

  const isMobile = device === "mobile";
  const Icon = isMobile ? Smartphone : Tablet;
  const label = isMobile ? labelMobile : labelTablet;
  const hint = isMobile ? hintMobile : hintTablet;
  const ariaLabel = hint ? `${label}. ${hint}` : label;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center whitespace-nowrap rounded-full font-semibold leading-tight ring-1 ring-inset",
        pad,
        textSize,
        isMobile ? DEVICE_PILL_STYLES.mobile : DEVICE_PILL_STYLES.kds,
        className,
      )}
      title={hint}
      aria-label={ariaLabel}
    >
      <Icon className={cn(iconSize, "shrink-0")} strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
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
          ? "bg-gradient-to-br from-blue-50 via-white to-blue-100/90 text-[#2563EB] ring-blue-200/80 shadow-blue-500/10"
          : "bg-gradient-to-br from-teal-50 via-white to-teal-100/80 text-teal-800 ring-teal-200/80 shadow-teal-500/10",
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
