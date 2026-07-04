import Link from "next/link";
import { Lock } from "lucide-react";
import { ProBadge } from "@/components/dashboard/pro-badge";
import { Button } from "@/components/ui/button";
import { LIVE360_UPGRADE_QUERY } from "@/lib/live360-plan";

type Props = {
  title: string;
  description: string;
  upgradeLabel: string;
  backLabel: string;
  backHref?: string;
  staffMode?: boolean;
};

export function ProFeatureLockedPanel({
  title,
  description,
  upgradeLabel,
  backLabel,
  backHref = "/dashboard",
  staffMode = false,
}: Props) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/10 to-cyan-50 text-brand-blue">
        <Lock className="h-7 w-7" aria-hidden />
      </div>
      <ProBadge size="sm" className="mb-3 shadow-glow" />
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!staffMode ? (
          <Button asChild>
            <Link href={`/dashboard/billing?upgrade=${LIVE360_UPGRADE_QUERY}`}>
              {upgradeLabel}
            </Link>
          </Button>
        ) : null}
        <Button variant="secondary" asChild>
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
