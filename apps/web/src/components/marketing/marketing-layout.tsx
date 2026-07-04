import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { SiteFooterSeoHub } from "@/components/seo/site-footer-seo-hub";
import { ValuePill } from "@/components/marketing/marketing-blocks";
import { cn } from "@/lib/utils";

export function MarketingSeoIntro({
  lead,
  paragraphs,
}: {
  lead?: string;
  paragraphs?: readonly string[];
}) {
  const items = paragraphs ?? [];
  if (!lead && items.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/90 to-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(37,99,235,0.06),transparent_60%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {lead ? (
          <p className="text-balance text-xl font-semibold leading-relaxed tracking-tight text-brand-navy sm:text-2xl">
            {lead}
          </p>
        ) : null}
        {items.length > 0 ? (
          <div className={cn("space-y-5", lead && "mt-8 border-t border-slate-200/80 pt-8")}>
            {items.map((para) => (
              <p key={para.slice(0, 48)} className="text-base leading-[1.75] text-slate-600 sm:text-lg">
                {para}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter seoHub={<SiteFooterSeoHub />} />
    </div>
  );
}

export function MarketingPageHero({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-hero-gradient">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        {badge ? (
          <div className="mb-5 flex justify-center">
            <ValuePill>{badge}</ValuePill>
          </div>
        ) : null}
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-navy sm:text-5xl lg:text-[3.25rem]">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">{subtitle}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function MarketingSection({
  children,
  className = "",
  id,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "muted" | "dark";
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-4 py-16 sm:px-6 sm:py-20",
        variant === "muted" && "border-y border-slate-100 bg-brand-surface/70",
        variant === "dark" && "bg-brand-navy text-white",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function MarketingProse({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-brand-navy prose-a:text-brand-blue prose-p:leading-relaxed">
        {children}
      </div>
    </div>
  );
}
