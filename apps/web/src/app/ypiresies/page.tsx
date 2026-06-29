import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.services);

const services = [
  {
    title: "Ψηφιακό menu με QR code",
    body:
      "Αντικαθιστάτε ή συμπληρώνετε το printed menu με ένα link που ανοίγει από QR. Ο πελάτης βλέπει κατηγορίες, φωτογραφίες, τιμές, περιγραφές και allergens — στο κινητό του, χωρίς app.",
  },
  {
    title: "Dashboard για την επιχείρησή σας",
    body:
      "Από ένα online panel προσθέτετε και αλλάζετε πιάτα, τιμές και διαθεσιμότητα. Δεν χρειάζεστε τεχνικές γνώσεις: συμπληρώνετε φόρμες όπως σε ένα απλό admin.",
  },
  {
    title: "Πολλαπλά menus ανά venue",
    body:
      "Πρωινό, εστιατόριο, pool bar, room service, spa — κάθε χώρος μπορεί να έχει δικό του menu. Ιδανικό για ξενοδοχεία με πολλές επιλογές εστίασης.",
  },
  {
    title: "4 γλώσσες out of the box",
    body:
      "Ελληνικά, Αγγλικά, Γερμανικά και Γαλλικά. Ο επισκέπτης επιλέγει γλώσσα με ένα πάτημα — χρήσιμο για τουρισμό σε νησιά και πόλεις.",
  },
  {
    title: "Call waiter (κλήση σερβιτόρου)",
    body:
      "Ο πελάτης πατάει ένα κουμπί στο menu και στέλνεται ειδοποίηση στο προσωπικό. Μπορείτε να ξέρετε και τον αριθμό τραπεζιού ή δωματίου από το QR link.",
  },
  {
    title: "QR codes έτοιμα για εκτύπωση",
    body:
      "Κατεβάζετε QR codes για τραπέζια, δωμάτια ή ειδικές γωνιές (bar, pool). Το link μπορεί να περιλαμβάνει table= ή room= για καλύτερη εξυπηρέτηση.",
  },
  {
    title: "Branding & χρώματα",
    body:
      "Προσαρμόζετε χρώματα και logo ώστε το menu να ταιριάζει στην ταυτότητα του χώρου σας — premium εμφάνιση που δείχνει επαγγελματισμό.",
  },
  {
    title: "Ασφάλεια & ιδιωτικότητα",
    body:
      "Κάθε επιχείρηση έχει δικό της χώρο δεδομένων. Τα στοιχεία σας δεν μοιράζονται με άλλους πελάτες της πλατφόρμας. Hosting με σύγχρονα standards ασφαλείας.",
  },
];

export default function ServicesPage() {
  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.services} />
      <MarketingPageHero
        title="Οι υπηρεσίες μας"
        subtitle="Όλα όσα χρειάζεστε για να προσφέρετε σύγχρονο ψηφιακό menu — από το QR μέχρι τη διαχείριση και την εξυπηρέτηση πελατών."
      />
      <MarketingSection>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map(({ title, body }) => (
            <Card key={title}>
              <h2 className="text-lg font-bold text-brand-navy">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-14 rounded-card bg-brand-gradient p-8 text-center text-white sm:p-10">
          <h2 className="text-2xl font-extrabold">Θέλετε να το δείτε live;</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/90">
            Δημιουργήστε δωρεάν λογαριασμό και φτιάξτε το πρώτο σας menu σε λίγα λεπτά.
          </p>
          <Link href="/register" className={`mt-6 inline-flex ${buttonClass("secondary")} !bg-white !text-brand-blue hover:!bg-brand-surface`}>
            Ξεκίνα δωρεάν δοκιμή
          </Link>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
