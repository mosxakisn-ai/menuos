import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseQrMenuLanguage, cuisineTypeQrLabel, isCuisineType } from "@menuos/shared";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { organizationCanUseLive360 } from "@/lib/billing";
import { getOrganizationNotificationSettings } from "@/lib/organization-notification-settings";
import { ensureMenuTranslationsBeforeRender } from "@/lib/ensure-menu-translations";
import { loadPublicVenueMenu, buildPublicVenuePayload } from "@/lib/public-menu-data";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import { PublicMenuUnavailable } from "@/components/menu/public-menu-unavailable";

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ table?: string; room?: string; sunbed?: string; lang?: string; embed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const venue = await loadPublicVenueMenu(venueSlug);
  if (!venue) {
    return buildPrivatePageMetadata(`Menu — ${venueSlug}`, `/m/${venueSlug}`);
  }
  const cuisine =
    venue.cuisineType && isCuisineType(venue.cuisineType)
      ? cuisineTypeQrLabel(venue.cuisineType, "EN")
      : null;
  const title = cuisine ? `${venue.name} — ${cuisine}` : venue.name;
  const description =
    venue.description?.trim() ||
    (cuisine
      ? `${venue.name}: ${cuisine}. Browse the digital menu on your phone.`
      : `${venue.name} — digital menu on MenuOS.`);
  return buildPrivatePageMetadata(title, `/m/${venueSlug}`, description);
}

export default async function PublicMenuPage({ params, searchParams }: Props) {
  const { venueSlug } = await params;
  const sp = await searchParams;
  const lang = parseQrMenuLanguage(sp.lang);

  let venue = await loadPublicVenueMenu(venueSlug);
  if (!venue) notFound();

  if (organizationIsPubliclyActive(venue.organization.subscription)) {
    const backfill = await ensureMenuTranslationsBeforeRender(venue.organizationId);
    if (backfill.ran) {
      venue = (await loadPublicVenueMenu(venueSlug)) ?? venue;
    }
  }

  if (!organizationIsPubliclyActive(venue.organization.subscription)) {
    return <PublicMenuUnavailable language={lang} />;
  }

  const trimParam = (v?: string) => {
    const t = v?.trim();
    return t || undefined;
  };

  const publicVenue = await buildPublicVenuePayload(venue);
  const live360Enabled = organizationCanUseLive360(venue.organization.subscription?.plan ?? "TRIAL");
  const notificationSettings = await getOrganizationNotificationSettings(venue.organizationId);

  return (
    <PublicMenuView
      venue={publicVenue}
      language={lang}
      tableNumber={trimParam(sp.table)}
      roomNumber={trimParam(sp.room)}
      sunbedNumber={trimParam(sp.sunbed)}
      embedMode={sp.embed === "1"}
      live360Enabled={live360Enabled}
      waiterCallEnabled={notificationSettings.waiterCallEnabled}
      customerOrdersEnabled={notificationSettings.customerOrdersEnabled}
    />
  );
}
