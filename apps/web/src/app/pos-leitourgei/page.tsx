import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.howItWorks);

const steps = [
  {
    title: "1. Εγγραφή & δοκιμή",
    body:
      "Μπαίνετε στο menuos.gr και δημιουργείτε λογαριασμό με email και στοιχεία επιχείρησης. Ξεκινάτε με δωρεάν δοκιμή 14 ημερών — χωρίς πιστωτική κάρτα. Μπορείτε αμέσως να μπείτε στο dashboard.",
  },
  {
    title: "2. Δημιουργία venue & menu",
    body:
      "Προσθέτετε το κατάστημα ή το ξενοδοχείο σας (venue), δίνετε όνομα και δημιουργείτε το πρώτο menu. Προσθέτετε κατηγορίες (π.χ. Σαλάτες, Κυρίως πιάτα) και μέσα σε κάθε κατηγορία τα πιάτα με τιμή, περιγραφή και προαιρετικά φωτογραφία.",
  },
  {
    title: "3. Γλώσσες & λεπτομέρειες",
    body:
      "Για κάθε πιάτο μπορείτε να συμπληρώσετε κείμενο στα Ελληνικά και στις ξένες γλώσσες. Ο επισκέπτης αλλάζει γλώσσα από το menu. Μπορείτε επίσης να σημειώσετε allergens και συστατικά.",
  },
  {
    title: "4. QR codes & τοποθέτηση",
    body:
      "Από το dashboard κατεβάζετε QR codes. Τα τοποθετείτε σε τραπέζια, δωμάτια ή στο bar. Αν θέλετε, το link μπορεί να περιλαμβάνει αριθμό τραπεζιού (π.χ. ?table=12) ώστε η κλήση σερβιτόρου να ξέρει από πού καλεί ο πελάτης.",
  },
  {
    title: "5. Εμπειρία πελάτη",
    body:
      "Ο πελάτης σκανάρει, βλέπει το menu, αλλάζει γλώσσα αν θέλει και καλεί σερβιτόρο όταν χρειάζεται. Όλα γίνονται στο browser — δεν εγκαθιστά τίποτα.",
  },
  {
    title: "6. Ενημερώσεις & συνδρομή",
    body:
      "Όταν αλλάζετε τιμή ή προσθέτετε πιάτο, η αλλαγή φαίνεται αμέσως. Μετά τη δοκιμή επιλέγετε πλάνο Basic ή Pro ανάλογα με venues και ανάγκες. Για μεγάλες αλυσίδες ή custom απαιτήσεις, επικοινωνείτε μαζί μας.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.howItWorks} />
      <MarketingPageHero
        title="Πώς λειτουργεί"
        subtitle="Από την εγγραφή μέχρι το QR στο τραπέζι — απλά βήματα, χωρίς περίπλοκη εγκατάσταση."
      />
      <MarketingSection>
        <div className="mx-auto max-w-3xl space-y-10">
          {steps.map(({ title, body }) => (
            <div key={title} className="border-l-4 border-brand-blue pl-6">
              <h2 className="text-xl font-bold text-brand-navy">{title}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link href="/register" className={buttonClass("primary", "lg")}>
            Ξεκίνα τώρα — δωρεάν 14 ημέρες
          </Link>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
