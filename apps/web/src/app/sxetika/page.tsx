import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.about);

export default function AboutPage() {
  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.about} />
      <MarketingPageHero
        title="Σχετικά με εμάς"
        subtitle="Φτιάχνουμε εργαλεία που κάνουν την καθημερινότητα στην εστίαση πιο απλή — για εσάς και για τον πελάτη."
      />
      <MarketingSection>
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-slate-600">
          <p>
            Το <strong className="text-brand-navy">MenuOS</strong> είναι μια ελληνική πλατφόρμα ψηφιακών menus με QR.
            Στόχος μας είναι απλός: να μπορεί κάθε εστιατόριο, ξενοδοχείο ή bar να προσφέρει σύγχρονο menu στο
            κινητό, χωρίς να χρειάζεται δικό του app ή περίπλοκο λογισμικό.
          </p>
          <p>
            Ξέρουμε την ελληνική αγορά φιλοξενίας — εποχικότητα, τουρίστες, πολλές γλώσσες, γρήγορες αλλαγές τιμών.
            Γι&apos; αυτό βάλαμε από την αρχή πολυγλωσσικό menu, call waiter και εύκολο dashboard που μπορεί να
            χρησιμοποιήσει ο manager χωρίς IT τμήμα.
          </p>
          <p>
            Δεν πουλάμε hardware ούτε «μαγικές» λύσεις. Σας δίνουμε μια καθαρή online υπηρεσία: φτιάχνετε menu,
            βγάζετε QR, οι πελάτες σκανάρουν. Εσείς κρατάτε τον έλεγχο του περιεχομένου και των τιμών.
          </p>
          <p>
            Η ομάδα πίσω από το MenuOS έχει εμπειρία σε digital προϊόντα και φιλοξενία. Υποστηρίζουμε πελάτες στην
            Ελλάδα με email και ξεκάθαρη επικοινωνία — χωρίς jargon.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl rounded-card border border-slate-200 bg-brand-surface p-8">
          <h2 className="text-xl font-bold text-brand-navy">Η αποστολή μας</h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            Να είναι το ψηφιακό menu τόσο απλό όσο το να αλλάξετε μια τιμή στο ταμπλό — αλλά πιο όμορφο, πιο
            πρακτικό και πιο φιλικό για τον επισκέπτη.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass("primary")}>
              Δοκιμή 14 ημερών
            </Link>
            <Link href="/epikoinonia" className={buttonClass("secondary")}>
              Επικοινωνία
            </Link>
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
