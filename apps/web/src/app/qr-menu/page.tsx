import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Globe, RefreshCw, Smartphone, Utensils } from "lucide-react";
import {
  FaqBlock,
  FeatureCard,
  MarketingCtaBand,
  SectionHeader,
} from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES, SEO_QR_MENU_FAQ } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.qrMenu);

const benefits = [
  {
    icon: RefreshCw,
    title: "Άμεσες ενημερώσεις",
    description: "Αλλάζετε τιμή ή πιάτο και η αλλαγή φαίνεται αμέσως — χωρίς επανεκτύπωση.",
    bullets: ["Λιγότερο κόστος χαρτιού", "Χωρίς λάθη από παλιές εκδόσεις", "Seasonal menus σε λεπτά"],
  },
  {
    icon: Globe,
    title: "Τουρίστες & πολυγλωσσία",
    description: "Ο επισκέπτης διαβάζει το menu στη γλώσσα του — ιδανικό για νησιά και πόλεις.",
    bullets: ["ΕΛ / EN", "Καλύτερη εμπειρία", "Περισσότερες γλώσσες σύντομα"],
  },
  {
    icon: Camera,
    title: "Visual menu",
    description: "Φωτογραφίες πιάτων, περιγραφές και allergens — premium εμφάνιση στο κινητό.",
    bullets: ["Αύξηση average order", "Upselling με εικόνες", "Professional branding"],
  },
  {
    icon: Smartphone,
    title: "Χωρίς app",
    description: "Μόνο QR και browser. Ο πελάτης δεν κατεβάζει τίποτα — μειώνετε friction.",
    bullets: ["Instant access", "Λειτουργεί σε iOS & Android", "Δεν χρειάζεται App Store"],
  },
];

const useCases = [
  "Εστιατόρια & ταβέρνες σε τουριστικές περιοχές",
  "Ξενοδοχεία με pool bar, breakfast και room service",
  "Beach bars & all-day cafes",
  "Catering & events με QR ανά χώρο",
];

export default function QrMenuLandingPage() {
  const p = MARKETING.pages.qrMenu;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.qrMenu} faq={SEO_QR_MENU_FAQ} />
      <MarketingPageHero
        title="QR Menu για εστιατόρια & ξενοδοχεία"
        subtitle={p.hero}
        badge={p.badge}
      />
      <MarketingSection>
        <SectionHeader
          title="Γιατί QR menu αντί για printed;"
          description="Το printed menu κοστίζει, καθυστερεί και δεν ακολουθεί τις αλλαγές της επιχείρησής σας. Το ψηφιακό menu είναι live, όμορφο και ελεγχόμενο από εσάς."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <FeatureCard key={b.title} {...b} />
          ))}
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHeader
            align="left"
            eyebrow="Use cases"
            title="Πού ταιριάζει το MenuOS"
            description="Από μικρή ταβέρνα μέχρι ξενοδοχειακή μονάδα — ίδια απλότητα, premium αποτέλεσμα."
            className="max-w-none"
          />
          <ul className="space-y-4">
            {useCases.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-card border border-slate-200/80 bg-white px-5 py-4 shadow-soft"
              >
                <Utensils className="h-5 w-5 shrink-0 text-brand-cyan" aria-hidden />
                <span className="font-medium text-brand-navy">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/register" className={`mx-auto mt-10 flex w-fit ${buttonClass("primary", "lg")}`}>
          Δωρεάν δοκιμή 7 ημερών
        </Link>
      </MarketingSection>
      <MarketingSection>
        <SectionHeader title="Συχνές ερωτήσεις" description="Ό,τι ρωτούν συχνά εστιάτορα και ξενοδόχοι." />
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqBlock items={[...SEO_QR_MENU_FAQ]} />
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title="Έτοιμοι για premium QR menu;"
          description="Φτιάξε το πρώτο σου menu σήμερα. 7 ημέρες δωρεάν, χωρίς κάρτα."
          primaryHref="/register"
          primaryLabel="Δημιουργία λογαριασμού"
          secondaryHref="/pricing"
          secondaryLabel="Δες τιμές"
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
