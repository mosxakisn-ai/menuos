/** Labels from old onboarding/demo seed — not real customer spaces. */

function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export type ShowcaseJunkOptions = {
  /** Also treat Αυλή-* prefixed tables as demo junk. */
  includeAuli?: boolean;
};

export function isShowcaseJunkSpotLabel(label: string, options?: ShowcaseJunkOptions): boolean {
  const raw = label.trim();
  if (!raw) return false;
  const n = normalizeLabel(raw);
  if (/^paralia-/.test(n)) return true;
  if (/^orofos-/.test(n) || /^οροφος-/.test(n)) return true;
  if (options?.includeAuli && (/^αυλη-/.test(n) || /^auli-/.test(n))) return true;
  return false;
}

export function isShowcaseJunkStationScreenLabel(label: string): boolean {
  const n = normalizeLabel(label);
  return n === "παραλια" || n === "paralia";
}

export function isShowcaseJunkWaiterLocation(
  location: {
    tableNumber?: string | null;
    roomNumber?: string | null;
    sunbedNumber?: string | null;
  },
  options?: ShowcaseJunkOptions,
): boolean {
  if (location.sunbedNumber && isShowcaseJunkSpotLabel(location.sunbedNumber, options)) return true;
  if (location.tableNumber && isShowcaseJunkSpotLabel(location.tableNumber, options)) return true;
  if (location.roomNumber && isShowcaseJunkSpotLabel(location.roomNumber, options)) return true;
  return false;
}

/** Typed test chips / keyboard mash — not real pass messages. */
export function isShowcaseJunkQuickChip(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length <= 3 && /^[a-z]+$/i.test(t)) return true;
  if (/^[ΔΓΦΞΛΚ]+[\d]*$/u.test(t)) return true;
  return false;
}
