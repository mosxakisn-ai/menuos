import type { Metadata } from "next";
import Link from "next/link";
import { Facebook, Mail, MessageCircle, Phone } from "lucide-react";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.contact);

export default function ContactPage() {
  const m = MARKETING;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.contact} />
      <MarketingPageHero
        title="Επικοινωνία"
        subtitle="Είμαστε εδώ για ερωτήσεις, δοκιμή ή custom πλάνο για μεγάλες επιχειρήσεις. Καλέστε, γράψτε ή στείλτε μήνυμα — απαντάμε προσωπικά."
      />
      <MarketingSection>
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <Phone className="h-8 w-8 text-brand-cyan" />
            <h2 className="mt-4 font-bold text-brand-navy">Τηλέφωνο</h2>
            <p className="mt-2 text-sm text-slate-600">
              Για άμεση ενημέρωση ή ραντεβού demo:
            </p>
            <a
              href={`tel:${m.contactPhoneTel}`}
              className="mt-4 inline-block font-semibold text-brand-blue hover:underline"
            >
              {m.contactPhone}
            </a>
          </Card>
          <Card>
            <Mail className="h-8 w-8 text-brand-blue" />
            <h2 className="mt-4 font-bold text-brand-navy">Email</h2>
            <p className="mt-2 text-sm text-slate-600">
              Για γενικές ερωτήσεις, τιμολόγηση Enterprise ή τεχνική υποστήριξη:
            </p>
            <a
              href={`mailto:${m.contactEmail}`}
              className="mt-4 inline-block font-semibold text-brand-blue hover:underline"
            >
              {m.contactEmail}
            </a>
          </Card>
          <Card>
            <Facebook className="h-8 w-8 text-brand-blue" />
            <h2 className="mt-4 font-bold text-brand-navy">Facebook</h2>
            <p className="mt-2 text-sm text-slate-600">
              Νέα, tips και ενημερώσεις για το MenuOS:
            </p>
            <a
              href={m.contactFacebook}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-semibold text-brand-blue hover:underline"
            >
              MenuOS Greece
            </a>
          </Card>
        </div>
        <div className="mx-auto mt-6 max-w-4xl">
          <Card>
            <MessageCircle className="h-8 w-8 text-brand-cyan" />
            <h2 className="mt-4 font-bold text-brand-navy">Νέος πελάτης;</h2>
            <p className="mt-2 text-sm text-slate-600">
              Αν θέλετε να δοκιμάσετε μόνοι σας, η δωρεάν εγγραφή είναι ο πιο γρήγορος τρόπος — 14 ημέρες χωρίς
              κάρτα.
            </p>
            <Link href="/register" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
              Δημιουργία λογαριασμού
            </Link>
          </Card>
        </div>
        <div className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-slate-600">
          <p>
            Το MenuOS απευθύνεται σε επιχειρήσεις στην Ελλάδα και στο εξωτερικό που θέλουν menu στη διεύθυνση{" "}
            <strong>menuos.gr</strong>. Για λογαριασμούς billing και συνδρομές, μετά την εγγραφή διαχειρίζεστε
            τα πάντα από το dashboard σας.
          </p>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
