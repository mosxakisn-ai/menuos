import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Facebook, Mail, MessageCircle, Phone } from "lucide-react";
import { MarketingCtaBand, SectionHeader } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.contact);

const contactCards = [
  {
    icon: Phone,
    title: "Τηλέφωνο",
    description: "Για άμεση ενημέρωση, demo ή ραντεβού:",
    href: (m: typeof MARKETING) => `tel:${m.contactPhoneTel}`,
    label: (m: typeof MARKETING) => m.contactPhone,
    external: false,
  },
  {
    icon: Mail,
    title: "Email",
    description: "Γενικές ερωτήσεις, Enterprise τιμολόγηση, τεχνική υποστήριξη:",
    href: (m: typeof MARKETING) => `mailto:${m.contactEmail}`,
    label: (m: typeof MARKETING) => m.contactEmail,
    external: false,
  },
  {
    icon: Facebook,
    title: "Facebook",
    description: "Νέα, tips και ενημερώσεις για το MenuOS:",
    href: (m: typeof MARKETING) => m.contactFacebook,
    label: () => "MenuOS Greece",
    external: true,
  },
] as const;

export default function ContactPage() {
  const m = MARKETING;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.contact} />
      <MarketingPageHero
        title="Επικοινωνία"
        subtitle="Είμαστε εδώ για ερωτήσεις, δοκιμή ή custom πλάνο για μεγάλες επιχειρήσεις. Απαντάμε προσωπικά — όχι bot."
        badge="Υποστήριξη"
      />
      <MarketingSection>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contactCards.map(({ icon: Icon, title, description, href, label, external }) => (
            <article
              key={title}
              className="group flex h-full flex-col rounded-card border border-slate-200/80 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
            >
              <div className="inline-flex rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-cyan/10 p-3 text-brand-blue">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-5 text-lg font-bold text-brand-navy">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
              <a
                href={href(m)}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="mt-4 inline-block font-semibold text-brand-blue group-hover:underline"
              >
                {label(m)}
              </a>
            </article>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-card border border-slate-200/80 bg-white p-8 shadow-card">
            <MessageCircle className="h-8 w-8 text-brand-cyan" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-brand-navy">Νέος πελάτης;</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Η δωρεάν εγγραφή είναι ο πιο γρήγορος τρόπος — 7 ημέρες χωρίς κάρτα. Φτιάξε venue, βάλε πιάτα και
              δοκίμασε το QR με τη δική σου ομάδα.
            </p>
            <Link href="/register" className={`mt-6 inline-flex ${buttonClass("primary")}`}>
              Δημιουργία λογαριασμού
            </Link>
          </article>
          <article className="rounded-card border border-slate-200/80 bg-white p-8 shadow-card">
            <Clock className="h-8 w-8 text-brand-blue" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-brand-navy">Enterprise & αλυσίδες</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Για πολλαπλά καταστήματα, white-label, custom domain ή ειδικές ανάγκες — επικοινωνήστε για
              προσφορά tailored στο project σας.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Προσαρμοσμένα πλάνα & SLA</li>
              <li>• Onboarding βοήθεια</li>
              <li>• Billing & συνδρομές από dashboard</li>
            </ul>
          </article>
        </div>
      </MarketingSection>
      <MarketingSection>
        <SectionHeader
          title="MenuOS — menuos.gr"
          description="Απευθύνεται σε επιχειρήσεις στην Ελλάδα και στο εξωτερικό. Μετά την εγγραφή, billing και συνδρομές από το dashboard σας."
        />
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title="Προτιμάς να μιλήσουμε;"
          description={`Κάλεσε ${m.contactPhone} ή γράψε ${m.contactEmail} — θα χαρούμε να σε βοηθήσουμε.`}
          primaryHref={`tel:${m.contactPhoneTel}`}
          primaryLabel="Κάλεσε τώρα"
          secondaryHref={`mailto:${m.contactEmail}`}
          secondaryLabel="Στείλε email"
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
