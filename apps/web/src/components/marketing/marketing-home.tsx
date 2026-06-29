import Link from "next/link";
import {
  Bell,
  Cloud,
  Globe,
  LayoutDashboard,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Cloud,
    title: "Cloud based",
    description: "SaaS platform — no servers to manage. Always up to date.",
  },
  {
    icon: Smartphone,
    title: "Every device",
    description: "Web, mobile, tablet. Guests scan QR — no app install.",
  },
  {
    icon: Zap,
    title: "Fast & easy",
    description: "Live in minutes. Update prices and items in seconds.",
  },
  {
    icon: Globe,
    title: "4 languages",
    description: "Greek, English, German, French for international guests.",
  },
  {
    icon: Bell,
    title: "Call waiter",
    description: "One tap from the menu. Real-time staff notifications.",
  },
  {
    icon: Shield,
    title: "Safe & reliable",
    description: "Secure multi-tenant platform. Your data protected.",
  },
];

export function MarketingHome() {
  return (
    <>
      <section className="relative overflow-hidden bg-hero-gradient pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-up flex flex-col items-center justify-center gap-3">
              <Logo href={false} showTagline markSize={56} />
            </div>
            <h1 className="animate-fade-up mt-6 text-4xl font-extrabold leading-tight text-brand-navy sm:text-5xl lg:text-6xl">
              Digital menus for
              <span className="block text-gradient-brand">modern hospitality</span>
            </h1>
            <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Transform your printed menu into a stunning mobile experience.
              Multi-language, call waiter, real-time updates — live in minutes.
            </p>
            <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className={buttonClass("primary", "lg")}>
                Start 14-day free trial
              </Link>
              <Link href="/pricing" className={buttonClass("secondary", "lg")}>
                View pricing
              </Link>
            </div>
          </div>

          <div className="animate-float relative mx-auto mt-16 max-w-sm">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-glow">
              <div className="rounded-card bg-brand-gradient p-4 text-white">
                <p className="text-lg font-bold">Marine Hotel</p>
                <p className="text-xs text-white/80">Pool Bar Menu</p>
              </div>
              <div className="mt-4 space-y-3">
                {["Signature Cocktails", "Light Bites", "Wines"].map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-lg bg-brand-surface px-3 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-brand-navy">{cat}</span>
                    <span className="text-brand-cyan">→</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-button bg-brand-gradient py-2.5 text-center text-xs font-bold text-white">
                Call Waiter · Table 12
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
              Everything you need
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Built for restaurants, hotels, beach bars, and room service teams.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="transition hover:shadow-cardHover">
                <div className="mb-4 inline-flex rounded-button bg-brand-blue/10 p-3 text-brand-blue">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-gradient py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready in 10 minutes</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            Sign up, add your venue, create your first menu, download your QR code.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-button bg-white px-6 py-3 text-sm font-bold text-brand-blue hover:bg-brand-surface"
          >
            Get started free
          </Link>
        </div>
      </section>
    </>
  );
}
