export type MenusNavParams = {
  venueId?: string;
  menuId?: string;
};

export function menusNavParamsMatchUrl(
  params: MenusNavParams,
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  if (params.venueId && searchParams.get("venue") !== params.venueId) return false;
  if (params.menuId && searchParams.get("menu") !== params.menuId) return false;
  return true;
}

export function buildMenusPageUrl(params: MenusNavParams): string {
  const qs = new URLSearchParams();
  if (params.venueId) qs.set("venue", params.venueId);
  if (params.menuId) qs.set("menu", params.menuId);
  const query = qs.toString();
  return query ? `/dashboard/menus?${query}` : "/dashboard/menus";
}

export function buildMenusImportUrl(params: MenusNavParams): string {
  const qs = new URLSearchParams();
  if (params.venueId) qs.set("venue", params.venueId);
  if (params.menuId) qs.set("menu", params.menuId);
  const query = qs.toString();
  return query ? `/dashboard/menus/import?${query}` : "/dashboard/menus/import";
}

export function buildBillingUpgradeUrl(upgrade: string, params?: MenusNavParams): string {
  const qs = new URLSearchParams();
  qs.set("upgrade", upgrade);
  if (params?.venueId) qs.set("venue", params.venueId);
  if (params?.menuId) qs.set("menu", params.menuId);
  return `/dashboard/billing?${qs.toString()}`;
}

export function resolveMenuIdForVenue(
  menuId: string | null | undefined,
  menus: { id: string }[],
): string {
  if (menuId && menus.some((m) => m.id === menuId)) return menuId;
  return menus[0]?.id ?? "";
}
