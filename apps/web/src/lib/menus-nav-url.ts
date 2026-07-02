export type MenusNavParams = {
  venueId?: string;
  menuId?: string;
};

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

export function resolveMenuIdForVenue(
  menuId: string | null | undefined,
  menus: { id: string }[],
): string {
  if (menuId && menus.some((m) => m.id === menuId)) return menuId;
  return menus[0]?.id ?? "";
}
