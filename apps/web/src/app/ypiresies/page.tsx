import type { Metadata } from "next";
import {
  Bell,
  Globe,
  LayoutDashboard,
  Palette,
  QrCode,
  Shield,
  UtensilsCrossed,
} from "lucide-react";
import {
  FeatureCard,
  MarketingCtaBand,
  SectionHeader,
  StatStrip,
} from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.services);

const services = [
  {
    icon: QrCode,
    title: "Ψηφιακό menu με QR code",
    description:
      "Ο πελάτης σκανάρει και βλέπει κατηγορίες, φωτογραφίες, τιμές, περιγραφές και allergens — χωρίς εγκατάσταση app.",
    bullets: ["Instant άνοιγμα στο browser", "QR ανά τραπέζι ή δωμάτιο", "Premium mobile layout"],
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard διαχείρισης",
    description:
      "Από ένα online panel προσθέτετε πιάτα, αλλάζετε τιμές και διαθεσιμότητα — χωρίς τεχνικές γνώσεις.",
    bullets: ["Φόρμες όπως απλό admin", "Πολλαπλά venues", "Άμεσες ενημερώσεις live"],
  },
  {
    icon: UtensilsCrossed,
    title: "Πολλαπλά menus ανά venue",
    description:
      "Πρωινό, εστιατόριο, pool bar, room service, spa — κάθε χώρος με δικό του κατάλογο.",
    bullets: ["Ιδανικό για ξενοδοχεία", "Ξεχωριστό branding ανά menu", "Εύκολη οργάνωση κατηγοριών"],
  },
  {
    icon: Globe,
    title: "Ελληνικά & Αγγλικά",
    description:
      "Στο QR menu ο πελάτης επιλέγει Ελληνικά ή English. Ξεχωριστό κείμενο ανά γλώσσα — περισσότερες γλώσσες σύντομα.",
    bullets: ["ΕΛ / EN switch", "Ιδανικό για τουρισμό", "Allergens & συστατικά"],
  },
  {
    icon: Bell,
    title: "Call waiter",
    description:
      "Ο πελάτης καλεί σερβιτόρο από το menu. Μπορείτε να ξέρετε τραπέζι ή δωμάτιο από το QR link.",
    bullets: ["Λιγότερες καθυστερήσεις", "Καλύτερη εξυπηρέτηση", "Rate limit για ασφάλεια"],
  },
  {
    icon: QrCode,
    title: "QR codes έτοιμα για εκτύπωση",
    description:
      "Κατεβάζετε QR για τραπέζια, δωμάτια, bar ή pool. Προαιρετικά table= / room= στα links.",
    bullets: ["High-res export", "Branded presentation", "Γρήγορη τοποθέτηση"],
  },
  {
    icon: Palette,
    title: "Branding & χρώματα",
    description:
      "Προσαρμόζετε χρώματα και logo ώστε το menu να ταιριάζει στην ταυτότητα του χώρου σας.",
    bullets: ["Premium εμφάνιση", "Συνέπεια με το venue", "Εντύπωση ποιότητας"],
  },
  {
    icon: Shield,
    title: "Ασφάλεια & ιδιωτικότητα",
    description:
      "Κάθε επιχείρηση έχει δικό της χώρο δεδομένων. Hosting με σύγχρονα standards ασφαλείας.",
    bullets: ["Multi-tenant isolation", "GDPR-ready", "Χωρίς κοινή χρήση δεδομένων"],
  },
];

export default function ServicesPage() {
  const p = MARKETING.pages.services;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.services} />
      <MarketingPageHero title="Οι υπηρεσίες μας" subtitle={p.hero} badge={p.badge} />
      <MarketingSection variant="muted">
        <StatStrip items={[...MARKETING.stats]} />
      </MarketingSection>
      <MarketingSection>
        <SectionHeader title="Τι περιλαμβάνει η πλατφόρμα" description={p.intro} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <FeatureCard key={s.title} {...s} />
          ))}
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title="Θέλετε να το δείτε live;"
          description="Δημιουργήστε δωρεάν λογαριασμό, φτιάξτε το πρώτο venue και δοκιμάστε το QR με τη δική σας ομάδα — σε λιγότερο από μία ώρα."
          primaryHref="/register"
          primaryLabel="Ξεκίνα δωρεάν 7 ημέρες"
          secondaryHref="/pos-leitourgei"
          secondaryLabel="Πώς λειτουργεί"
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
