export type BusinessDisplayVenue = {
  name: string;
  logoUrl: string | null;
  settings?: { brandName: string | null } | null;
};

/** Primary business name + logo for dashboard chrome (header, sidebar). */
export function resolveBusinessDisplay(input: {
  organizationName: string;
  venues: BusinessDisplayVenue[];
}): { name: string; logoUrl: string | null } {
  const { organizationName, venues } = input;
  const logoUrl = venues.find((v) => v.logoUrl)?.logoUrl ?? null;

  if (venues.length === 0) {
    return { name: organizationName, logoUrl };
  }

  const primary = venues[0]!;
  const brandName = primary.settings?.brandName?.trim();

  if (venues.length === 1) {
    return {
      name: brandName || primary.name || organizationName,
      logoUrl: primary.logoUrl ?? logoUrl,
    };
  }

  return { name: organizationName, logoUrl };
}
