import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-chrome";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-hero-gradient">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      <SiteHeader />
      <main className="relative mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
        <div className="rounded-card border border-slate-200/80 bg-white/95 p-8 shadow-card backdrop-blur-sm">
          <h1 className="text-2xl font-extrabold text-brand-navy">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
          {children}
        </div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </main>
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="text-center text-sm text-slate-600">
      {text}{" "}
      <Link href={href} className="font-semibold text-brand-blue hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
