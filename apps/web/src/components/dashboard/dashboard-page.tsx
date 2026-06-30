import { cn } from "@/lib/utils";

export const dashboardLabelClass = "text-sm font-medium text-brand-navy";
export const dashboardFieldClass =
  "mt-1.5 h-10 w-full rounded-button border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15";
export const dashboardTextareaClass =
  "mt-1.5 w-full rounded-button border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

export function DashboardPage({
  children,
  className,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className={cn("space-y-6", wide ? "w-full" : "mx-auto w-full max-w-5xl", className)}>{children}</div>
  );
}

export function DashboardPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-primary sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function DashboardSectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="font-semibold text-brand-navy">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p> : null}
    </div>
  );
}
