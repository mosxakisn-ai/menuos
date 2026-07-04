import Link from "next/link";
import { SEO_FOOTER_HUB } from "@/content/seo-footer-hub";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";

/** Crawlable footer hub — server-rendered so client JS does not pull seo-landing LANDINGS. */
export async function SiteFooterSeoHub() {
  const locale = await getServerLocale();
  const isEn = locale === "en";
  const { marketing } = await getMessages(locale);
  const f = marketing.footer;
  const hub =
    "hub" in f
      ? (f as {
          hub: {
            title: string;
            localTitle: string;
            verticalTitle: string;
            description: string;
          };
        }).hub
      : null;

  return (
    <nav className="sr-only" aria-label={isEn ? "Site guides" : "Οδηγοί ιστοτόπου"}>
      {hub ? <p>{hub.description}</p> : null}
      <ul>
        {SEO_FOOTER_HUB.local.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{isEn ? link.labelEn : link.labelEl}</Link>
          </li>
        ))}
        {SEO_FOOTER_HUB.verticals.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{isEn ? link.labelEn : link.labelEl}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
