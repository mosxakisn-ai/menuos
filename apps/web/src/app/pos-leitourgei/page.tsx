import type { Metadata } from "next";
import Link from "next/link";
import { MarketingCtaBand, SectionHeader, TimelineStep } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.howItWorks);

const steps = [
  {
    title: "Εγγραφή & δοκιμή",
    body:
      "Δημιουργείτε λογαριασμό με email, επωνυμία επιχείρησης και OTP επιβεβαίωση. Ξεκινάτε με 7 ημέρες δωρεάν — χωρίς πιστωτική κάρτα.",
    detail: "Μετά την εγγραφή μπαίνετε αμέσως στο dashboard με trial πλάνο.",
  },
  {
    title: "Δημιουργία venue & menu",
    body:
      "Προσθέτετε venue (εστιατόριο, bar, ξενοδοχείο), δημιουργείτε menu και κατηγορίες. Κάθε πιάτο έχει τιμή, περιγραφή και προαιρετική φωτογραφία.",
    detail: "Παράδειγμα: Σαλάτες → Χωριάτικη €12, allergens, φωτό.",
  },
  {
    title: "Γλώσσες & λεπτομέρειες",
    body:
      "Συμπληρώνετε κείμενα στα Ελληνικά και στα Αγγλικά. Ο επισκέπτης αλλάζει γλώσσα (ΕΛ / EN) από το QR menu.",
    detail: "Allergens, συστατικά και διαθεσιμότητα πιάτου — όλα online.",
  },
  {
    title: "QR codes & τοποθέτηση",
    body:
      "Κατεβάζετε QR codes από το dashboard και τους τοποθετείτε σε τραπέζια, δωμάτια ή bar.",
    detail: "Links τύπου ?table=12 βοηθούν το call waiter να ξέρει από πού καλεί ο πελάτης.",
  },
  {
    title: "Εμπειρία πελάτη",
    body:
      "Ο πελάτης σκανάρει, βλέπει το menu, αλλάζει γλώσσα και καλεί σερβιτόρο όταν χρειάζεται — όλα στο browser.",
    detail: "Χωρίς app, χωρίς login για τον επισκέπτη.",
  },
  {
    title: "Ενημερώσεις & συνδρομή",
    body:
      "Αλλαγές τιμών και πιάτων φαίνονται αμέσως. Μετά τη δοκιμή επιλέγετε Basic ή Pro — ή Enterprise για custom ανάγκες.",
    detail: "Billing μέσω Stripe, διαφανής τιμολόγηση.",
  },
];

export default function HowItWorksPage() {
  const p = MARKETING.pages.howItWorks;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.howItWorks} />
      <MarketingPageHero title="Πώς λειτουργεί" subtitle={p.hero} badge={p.badge} />
      <MarketingSection>
        <SectionHeader
          eyebrow="Η διαδικασία"
          title="Από το signup μέχρι το live menu"
          description="Έξι απλά βήματα. Χωρίς εγκατάσταση, χωρίς printed menu, χωρίς IT τμήμα."
          align="left"
          className="max-w-2xl"
        />
        <div className="mx-auto mt-14 max-w-3xl">
          {steps.map((step, i) => (
            <TimelineStep
              key={step.title}
              step={String(i + 1)}
              title={step.title}
              body={step.body}
              detail={step.detail}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link href="/register" className={buttonClass("primary", "lg")}>
            Ξεκίνα τώρα — δωρεάν 7 ημέρες
          </Link>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title="Θέλεις demo πριν ξεκινήσεις;"
          description="Κάλεσέ μας στο 210 700 0925 ή γράψε στο info@b-os.gr — θα σου δείξουμε τη ροή live."
          primaryHref="/epikoinonia"
          primaryLabel="Επικοινωνία"
          secondaryHref="/ypiresies"
          secondaryLabel="Όλες οι υπηρεσίες"
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
