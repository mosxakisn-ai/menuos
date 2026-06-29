import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function MarketingPageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-hero-gradient px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold leading-tight text-brand-navy sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">{subtitle}</p>
      </div>
    </section>
  );
}

export function MarketingSection({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-4 py-14 sm:px-6 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function MarketingProse({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:text-brand-navy prose-a:text-brand-blue">
        {children}
      </div>
    </div>
  );
}
