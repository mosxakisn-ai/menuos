import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { SEO_PAGES, SEO_QR_MENU_FAQ } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.qrMenu);

export default function QrMenuLandingPage() {
  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.qrMenu} faq={SEO_QR_MENU_FAQ} />
      <MarketingPageHero
        title="QR Menu για εστιατόρια & ξενοδοχεία"
        subtitle="Αντικαταστήστε ή συμπληρώστε το printed menu με μια όμορφη mobile εμπειρία. Οι πελάτες σκανάρουν — εσείς ελέγχετε το περιεχόμενο."
      />
      <MarketingSection>
        <div className="mx-auto max-w-3xl space-y-6 leading-relaxed text-slate-600">
          <p>
            Το QR menu είναι η πιο πρακτική λύση όταν θέλετε ενημερωμένες τιμές, φωτογραφίες πιάτων και πολλές
            γλώσσες χωρίς να ξανατυπώνετε χαρτιά κάθε σεζόν. Με το MenuOS φτιάχνετε το menu online, βγάζετε QR
            codes και τους τοποθετείτε στα τραπέζια ή στα δωμάτια.
          </p>
          <p>
            Ιδανικό για εστιατόρια σε τουριστικές περιοχές, ξενοδοχεία με πολλαπλά σημεία εστίασης, beach bars και
            cafe που θέλουν γρήγορες αλλαγές στο menu.
          </p>
        </div>
        <Link href="/register" className={`mx-auto mt-8 flex w-fit ${buttonClass("primary", "lg")}`}>
          Δωρεάν δοκιμή 14 ημερών
        </Link>
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-extrabold text-brand-navy">Συχνές ερωτήσεις</h2>
          <div className="mt-8 space-y-8">
            {SEO_QR_MENU_FAQ.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-bold text-brand-navy">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
