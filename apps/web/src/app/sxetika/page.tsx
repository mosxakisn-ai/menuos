import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { MarketingCtaBand, SectionHeader, StatStrip } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

const valueIcons = [Sparkles, MapPin, Heart];

export default function AboutPage() {
  const p = MARKETING.pages.about;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.about} />
      <MarketingPageHero title="Σχετικά με εμάς" subtitle={p.hero} badge={p.badge} />
      <MarketingSection variant="muted">
        <StatStrip items={[...MARKETING.stats]} />
      </MarketingSection>
      <MarketingSection>
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-slate-600">
          <p>
            Το <strong className="text-brand-navy">MenuOS</strong> είναι ελληνική πλατφόρμα ψηφιακών menus με QR.
            Στόχος μας: κάθε εστιατόριο, ξενοδοχείο ή bar να προσφέρει σύγχρονο menu στο κινητό — χωρίς δικό του
            app ή περίπλοκο λογισμικό.
          </p>
          <p>
            Γνωρίζουμε την ελληνική αγορά φιλοξενίας: εποχικότητα, τουρίστες, πολλές γλώσσες, γρήγορες αλλαγές
            τιμών. Γι&apos; αυτό βάλαμε από την αρχή πολυγλωσσικό menu, call waiter και dashboard που χρησιμοποιεί
            ο manager χωρίς IT τμήμα.
          </p>
          <p>
            Δεν πουλάμε hardware ούτε «μαγικές» λύσεις. Σας δίνουμε καθαρή online υπηρεσία: φτιάχνετε menu, βγάζετε
            QR, οι πελάτες σκανάρουν. Εσείς κρατάτε τον έλεγχο περιεχομένου και τιμών.
          </p>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <SectionHeader title="Οι αξίες μας" description="Αυτό που μας οδηγεί σε κάθε feature και κάθε υποστήριξη." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {p.values.map(({ title, text }, i) => {
            const Icon = valueIcons[i] ?? Sparkles;
            return (
              <article
                key={title}
                className="rounded-card border border-slate-200/80 bg-white p-6 shadow-card"
              >
                <div className="inline-flex rounded-xl bg-brand-blue/10 p-3 text-brand-blue">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>
      <MarketingSection>
        <div className="mx-auto max-w-3xl rounded-card border border-slate-200 bg-gradient-to-br from-brand-surface to-white p-8 sm:p-10">
          <h2 className="text-2xl font-extrabold text-brand-navy">Η αποστολή μας</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Να είναι το ψηφιακό menu τόσο απλό όσο το να αλλάξετε μια τιμή — αλλά πιο όμορφο, πιο πρακτικό και
            πιο φιλικό για τον επισκέπτη.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Υποστηρίζουμε πελάτες στην Ελλάδα με τηλέφωνο, email και προσωπική επικοινωνία — χωρίς jargon.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass("primary")}>
              Δοκιμή 7 ημερών
            </Link>
            <Link href="/epikoinonia" className={buttonClass("secondary")}>
              Επικοινωνία
            </Link>
          </div>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title="Ας φτιάξουμε το menu σας"
          description="7 ημέρες δωρεάν. Χωρίς κάρτα. Ξεκίνα σήμερα και δες το αποτέλεσμα στο κινητό σου."
          primaryHref="/register"
          primaryLabel="Δημιουργία λογαριασμού"
          secondaryHref="/ypiresies"
          secondaryLabel="Υπηρεσίες"
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
