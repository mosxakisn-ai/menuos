import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.contact);

export default function ContactPage() {
  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.contact} />
      <MarketingPageHero
        title="Επικοινωνία"
        subtitle="Είμαστε εδώ για ερωτήσεις, δοκιμή ή custom πλάνο για μεγάλες επιχειρήσεις. Γράψτε μας — απαντάμε προσωπικά."
      />
      <MarketingSection>
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          <Card>
            <Mail className="h-8 w-8 text-brand-blue" />
            <h2 className="mt-4 font-bold text-brand-navy">Email</h2>
            <p className="mt-2 text-sm text-slate-600">
              Για γενικές ερωτήσεις, τιμολόγηση Enterprise ή τεχνική υποστήριξη:
            </p>
            <a
              href={`mailto:${MARKETING.contactEmail}`}
              className="mt-4 inline-block font-semibold text-brand-blue hover:underline"
            >
              {MARKETING.contactEmail}
            </a>
          </Card>
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
