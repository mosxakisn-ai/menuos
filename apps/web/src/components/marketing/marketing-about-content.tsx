import { Check, Quote } from "lucide-react";
import { SectionHeader } from "@/components/marketing/marketing-blocks";

export type AboutPageContent = {
  intro: readonly string[];
  hospitality: {
    title: string;
    lead: string;
    bullets: readonly string[];
    closing: string;
  };
  philosophy: {
    title: string;
    tagline: string;
    paragraphs: readonly string[];
  };
  offers: {
    title: string;
    bullets: readonly string[];
  };
  atGlance: {
    title: string;
    bullets: readonly string[];
  };
};

function CheckList({ items, columns = 2 }: { items: readonly string[]; columns?: 1 | 2 }) {
  return (
    <ul
      className={
        columns === 2
          ? "grid gap-3 sm:grid-cols-2 sm:gap-4"
          : "space-y-3"
      }
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-soft"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-cyan text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          </span>
          <span className="text-sm leading-relaxed text-slate-700 sm:text-base">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MarketingAboutContent({ content }: { content: AboutPageContent }) {
  return (
    <>
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-6">
          {content.intro.map((para, i) => (
            <p
              key={para.slice(0, 40)}
              className={
                i === 0
                  ? "text-balance text-xl font-medium leading-relaxed text-brand-navy sm:text-2xl"
                  : "text-lg leading-[1.75] text-slate-600"
              }
            >
              {para}
            </p>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-brand-surface/70 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 lg:items-start">
            <div>
              <SectionHeader title={content.hospitality.title} align="left" className="max-w-none" />
              <p className="mt-6 text-lg leading-relaxed text-slate-600">{content.hospitality.lead}</p>
              <p className="mt-8 text-base leading-[1.75] text-slate-600">{content.hospitality.closing}</p>
            </div>
            <CheckList items={content.hospitality.bullets} columns={1} />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title={content.philosophy.title} align="left" className="max-w-none" />
          <blockquote className="relative mt-10 overflow-hidden rounded-card border border-slate-200/80 bg-gradient-to-br from-brand-surface via-white to-cyan-50/40 p-8 sm:p-10">
            <Quote
              className="absolute right-6 top-6 h-10 w-10 text-brand-blue/10 sm:h-12 sm:w-12"
              aria-hidden
            />
            <p className="relative max-w-3xl text-balance text-xl font-semibold leading-relaxed text-brand-navy sm:text-2xl">
              {content.philosophy.tagline}
            </p>
          </blockquote>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {content.philosophy.paragraphs.map((para) => (
              <p key={para.slice(0, 48)} className="text-base leading-[1.75] text-slate-600 sm:text-lg">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-brand-surface/70 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title={content.offers.title} align="left" className="max-w-none" />
          <div className="mt-10">
            <CheckList items={content.offers.bullets} />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title={content.atGlance.title} align="left" className="max-w-none" />
          <div className="mt-10">
            <CheckList items={content.atGlance.bullets} columns={2} />
          </div>
        </div>
      </section>
    </>
  );
}

export function MarketingAboutMission({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: readonly string[];
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-card border border-slate-200 bg-gradient-to-br from-brand-surface to-white p-8 sm:p-10">
      <h2 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">{title}</h2>
      <div className="mt-6 space-y-4">
        {paragraphs.map((para) => (
          <p key={para.slice(0, 48)} className="text-lg leading-[1.75] text-slate-600">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
