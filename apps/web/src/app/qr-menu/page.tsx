import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buttonClass } from "@/components/ui/button";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "QR Menu for Restaurants & Hotels",
  description:
    "Create a premium digital QR menu for your restaurant or hotel. Multi-language, call waiter, instant updates.",
  path: "/qr-menu",
});

export default function QrMenuLandingPage() {
  const faq = [
    {
      q: "What is a QR menu?",
      a: "A QR menu lets guests scan a code with their phone and browse your digital menu instantly — no app download required.",
    },
    {
      q: "Does MenuOS support hotels?",
      a: "Yes. MenuOS supports restaurants, hotels, pool bars, room service, spa menus, and more.",
    },
    {
      q: "How many languages are supported?",
      a: "Greek, English, German, and French out of the box.",
    },
  ];

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "QR Menu for Restaurants & Hotels",
      url: absoluteUrl("/qr-menu"),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLdScript data={schema} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="font-serif text-4xl font-bold text-primary">
          QR Menu for Restaurants & Hotels
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-600">
          Replace printed menus with a premium mobile experience. MenuOS helps you launch a
          multi-language digital menu with QR codes, real-time updates, and call-waiter — in minutes.
        </p>
        <Link href="/register" className={`mt-8 inline-flex ${buttonClass("primary", "lg")}`}>
          Start free trial
        </Link>
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-primary">FAQ</h2>
          <div className="mt-6 space-y-6">
            {faq.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-primary">{q}</h3>
                <p className="mt-2 text-sm text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
