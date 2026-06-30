import Link from "next/link";
import { Clock, Facebook, Mail, MessageCircle, Phone } from "lucide-react";
import { MarketingCtaBand, SectionHeader } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { generateMarketingMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return generateMarketingMetadata("contact");
}

const cardIcons = [Phone, Mail, Facebook, MessageCircle];

export default async function ContactPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = await getMessages(locale);
  const ui = pages.contact;

  const cards = ui.cards.map((card, i) => ({
    icon: cardIcons[i] ?? Mail,
    title: card.title,
    description: card.description,
    href:
      i === 0
        ? `tel:${marketing.contactPhoneTel}`
        : i === 1
          ? `mailto:${marketing.contactEmail}`
          : i === 2
            ? marketing.contactFacebook
            : marketing.contactWhatsApp,
    label:
      i === 0
        ? marketing.contactPhone
        : i === 1
          ? marketing.contactEmail
          : (card as { label?: string }).label ?? (i === 2 ? "MenuOS Greece" : "WhatsApp"),
    external: i === 2 || i === 3,
  }));

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="contact" />
      <MarketingPageHero title={ui.heroTitle} subtitle={ui.heroSubtitle} badge={ui.badge} />
      <MarketingSection>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, title, description, href, label, external }) => (
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
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="mt-4 inline-block font-semibold text-brand-blue group-hover:underline"
              >
                {label}
              </a>
            </article>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-card border border-slate-200/80 bg-white p-8 shadow-card">
            <MessageCircle className="h-8 w-8 text-brand-cyan" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-brand-navy">{ui.newCustomerTitle}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">{ui.newCustomerBody}</p>
            <Link href="/register" className={`mt-6 inline-flex ${buttonClass("primary")}`}>
              {pages.common.createAccount}
            </Link>
          </article>
          <article className="rounded-card border border-slate-200/80 bg-white p-8 shadow-card">
            <Clock className="h-8 w-8 text-brand-blue" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-brand-navy">{ui.enterpriseTitle}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">{ui.enterpriseBody}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {ui.enterpriseBullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          </article>
        </div>
      </MarketingSection>
      <MarketingSection>
        <SectionHeader title={ui.infoTitle} description={ui.infoDesc} />
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title={ui.cta.title}
          description={`${marketing.contactPhone} · ${marketing.contactEmail}`}
          primaryHref={`tel:${marketing.contactPhoneTel}`}
          primaryLabel={ui.cta.primary}
          secondaryHref={`mailto:${marketing.contactEmail}`}
          secondaryLabel={ui.cta.secondary}
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
