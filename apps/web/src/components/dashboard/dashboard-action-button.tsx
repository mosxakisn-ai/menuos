"use client";

import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

export type DashboardActionVariant = "neutral" | "danger" | "warning";

const ICON_VARIANT_CLASSES: Record<DashboardActionVariant, string> = {
  neutral:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-brand-navy",
  danger:
    "border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800",
  warning:
    "border-amber-200 bg-white text-amber-900 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-950",
};

export function dashboardIconButtonClass(
  variant: DashboardActionVariant = "neutral",
  size: "sm" | "md" = "sm",
) {
  const pad = size === "sm" ? "min-h-9 min-w-9 px-2" : "min-h-10 min-w-10 px-2.5";
  return cn(
    "inline-flex items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
    pad,
    ICON_VARIANT_CLASSES[variant],
  );
}

export function dashboardTextActionClass(variant: DashboardActionVariant = "neutral") {
  if (variant === "danger") {
    return cn(
      buttonClass("secondary", "sm"),
      "border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800",
    );
  }
  if (variant === "warning") {
    return cn(
      buttonClass("secondary", "sm"),
      "border-amber-200 text-amber-900 hover:border-amber-300 hover:bg-amber-50",
    );
  }
  return buttonClass("secondary", "sm");
}

type DashboardIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: DashboardActionVariant;
  size?: "sm" | "md";
  label: string;
};

export function DashboardIconButton({
  variant = "neutral",
  size = "sm",
  label,
  className,
  children,
  ...props
}: DashboardIconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(dashboardIconButtonClass(variant, size), className)}
      {...props}
    >
      {children}
    </button>
  );
}
