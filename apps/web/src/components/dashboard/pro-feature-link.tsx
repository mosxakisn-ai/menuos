import Link from "next/link";
import type { ReactNode } from "react";
import { ProBadge } from "@/components/dashboard/pro-badge";
import { cn } from "@/lib/utils";

export function ProFeatureLink({
  href,
  icon,
  label,
  className,
}: {
  href: string;
  icon?: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-10 items-center gap-2 rounded-button border border-brand-blue/25 bg-gradient-to-r from-white via-brand-blue/[0.05] to-cyan-50/70 px-3.5 text-sm font-semibold text-brand-navy shadow-sm ring-1 ring-brand-blue/[0.06]",
        "transition hover:border-brand-blue/45 hover:from-brand-blue/[0.08] hover:to-cyan-50 hover:shadow-md hover:shadow-brand-blue/15",
        className,
      )}
    >
      {icon}
      <span>{label}</span>
      <ProBadge className="transition group-hover:shadow-glow" />
    </Link>
  );
}
