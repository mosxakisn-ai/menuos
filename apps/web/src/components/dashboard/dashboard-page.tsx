import { cn } from "@/lib/utils";

export const dashboardLabelClass = "block text-sm font-medium text-brand-navy";
export const dashboardFieldClass =
  "mt-1.5 h-10 w-full rounded-button border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15";
export const dashboardInputClass =
  "h-10 w-full rounded-button border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15";
export const dashboardTextareaClass =
  "mt-1.5 w-full rounded-button border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15";
export const dashboardSelectClass = dashboardFieldClass;
export const dashboardCardClass =
  "rounded-card border border-slate-100 bg-white p-5 shadow-card sm:p-6";
export const dashboardFormGridClass = "grid gap-4 sm:grid-cols-2";
export const dashboardFormActionsClass = "flex flex-wrap items-center gap-3 pt-1";

export function DashboardPage({
  children,
  className,
  wide = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** @default true — matches settings / layout width */
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6",
        wide ? "max-w-6xl" : "max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
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
    <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 text-center sm:text-left">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-primary sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:mx-0">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 items-center justify-center gap-2 sm:justify-end">{action}</div>
      ) : null}
    </div>
  );
}

export function DashboardSectionTitle({
  title,
  description,
  centered,
}: {
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={cn(centered && "text-center")}>
      <h2 className="font-semibold text-brand-navy">{title}</h2>
      {description ? (
        <p className={cn("mt-1 text-sm leading-relaxed text-slate-600", centered && "mx-auto max-w-xl")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function DashboardToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-card sm:justify-start sm:gap-5 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardStatCard({
  label,
  value,
  hint,
  compact,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  compact?: boolean;
  accent?: "blue" | "cyan" | "slate";
}) {
  const accentClass =
    accent === "cyan"
      ? "from-brand-cyan/10 to-transparent"
      : accent === "slate"
        ? "from-slate-100/80 to-transparent"
        : "from-brand-blue/10 to-transparent";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm transition hover:border-brand-blue/20 hover:shadow-md",
        compact ? "p-4 text-left" : cn(dashboardCardClass, "flex flex-col items-center justify-center text-center"),
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70",
          accentClass,
        )}
        aria-hidden
      />
      <div className={cn("relative", compact ? "" : "flex flex-col items-center")}>
        <p
          className={cn(
            "font-semibold uppercase tracking-[0.1em] text-slate-500",
            compact ? "text-[10px]" : "text-[11px]",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1.5 font-serif font-bold tabular-nums leading-none text-brand-navy",
            compact ? "text-2xl" : "mt-2 text-3xl text-primary",
          )}
        >
          {value}
        </p>
        {hint ? (
          <p
            className={cn(
              "text-slate-500",
              compact ? "mt-1.5 text-[11px] leading-snug" : "mt-2.5 text-xs font-medium text-brand-blue",
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardFieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block w-full min-w-0", className)}>
      <span className={dashboardLabelClass}>{label}</span>
      {children}
    </label>
  );
}
