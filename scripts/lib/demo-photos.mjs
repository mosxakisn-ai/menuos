/** Curated Unsplash URLs for demo-taverna (food & drinks). w=480 for menu card thumbnails. */
const U = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=360&h=270&q=65`;

export const DEMO_PHOTOS = {
  Χωριάτικη: U("photo-1592417817098-8fd3d9eb14a5"),
  Ρόκα: U("photo-1546069901-ba9599a7e63c"),
  Μουσακάς: U("photo-1596797038530-2c107229654b"),
  "Σουβλάκι χοιρινό": U("photo-1559847844-5315695dadae"),
  "Ψητή τσιπούρα": U("photo-1751094069288-a2bcef5eb6c8"),
  Μπύρα: U("photo-1608270586620-248524c67de9"),
  "Κρασί κόκκινο (ποτήρι)": U("photo-1553361371-9b22f78e8b1d"),
};

/** Fuzzy match for PDF imports or slight name differences. */
const PHOTO_ALIASES = [
  { match: /χωριάτ|greek\s*salad/i, url: DEMO_PHOTOS["Χωριάτικη"] },
  { match: /ρόκα|rucola|rocket/i, url: DEMO_PHOTOS["Ρόκα"] },
  { match: /μουσακ|moussaka/i, url: DEMO_PHOTOS["Μουσακάς"] },
  { match: /σουβλ|souvlaki/i, url: DEMO_PHOTOS["Σουβλάκι χοιρινό"] },
  { match: /τσιπούρ|sea\s*bream|dorade/i, url: DEMO_PHOTOS["Ψητή τσιπούρα"] },
  { match: /μπύρ|beer/i, url: DEMO_PHOTOS["Μπύρα"] },
  { match: /κρασί|wine/i, url: DEMO_PHOTOS["Κρασί κόκκινο (ποτήρι)"] },
];

export function resolveDemoPhoto(nameGr) {
  if (!nameGr?.trim()) return undefined;
  const exact = DEMO_PHOTOS[nameGr.trim()];
  if (exact) return exact;
  for (const { match, url } of PHOTO_ALIASES) {
    if (match.test(nameGr)) return url;
  }
  return undefined;
}

/** Categories that look best with hero photos (not compact rows). */
export const DEMO_PHOTO_CATEGORY_NAMES = /σαλάτ|κυρίως|πιάτ|ποτ|main|salad|plat|drink|getränk/i;
