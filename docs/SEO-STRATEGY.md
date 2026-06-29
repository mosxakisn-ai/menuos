# MenuOS — SEO Strategy

> Modeled after MatchWork production SEO stack. See MatchWork `docs/SEO-ANALYSIS.md` for reference.

## Goals

Rank on Google for:
- Generic: "QR menu", "digital menu", "ψηφιακό menu εστιατορίου"
- Vertical: restaurant, hotel, beach bar, room service, spa menu
- Geo: "QR menu Ρόδος", "digital menu Σαντορίνη", city × vertical combos
- Intent: "πώς φτιάχνω QR menu", "digital menu vs printed"

## Architecture (copy MatchWork pattern)

### Central library — `lib/seo.ts`
- `buildPageMetadata()` — title, description, keywords, canonical
- `buildRootMetadata()` — site-wide + Google verification
- `buildPrivatePageMetadata()` — noindex for dashboard/auth
- `buildHreflangAlternates()` — GR default clean URL; EN/DE/FR via `?lang=`
- `absoluteUrl()`, `openGraphImageUrl()`
- Open Graph + Twitter cards

### Technical files
| File | Purpose |
|------|---------|
| `app/robots.ts` | Allow `/`, disallow `/api/`, `/dashboard/`, `/login`, `/m/` |
| `app/sitemap.ts` | Dynamic: static + landings + blog |
| `app/opengraph-image.tsx` | Dynamic OG 1200×630 per locale |
| `app/manifest.ts` | PWA manifest |
| `app/llms.txt/route.ts` | AI/crawler discoverability |

### JSON-LD (`lib/seo-structured-data.ts`)
| Schema | Where |
|--------|-------|
| Organization | Root layout |
| WebSite + SearchAction | Root layout |
| SoftwareApplication | Homepage / pricing |
| FAQPage | SEO landings |
| BreadcrumbList | Landings, blog |
| Product/Offer | Pricing page (plans) |

Public QR menus (`/m/*`) and dashboard → **noindex** + robots disallow.

## Programmatic Landing Pages

Config-driven slugs (like MatchWork `seo-landing.ts`):

### Categories (vertical)
```
/qr-menu                    → generic QR menu
/digital-menu               → generic digital menu
/estiatorio/qr-menu         → restaurants
/ksenoδοχειo/digital-menu   → hotels (latin slug: /xenodocheio/digital-menu)
/beach-bar/qr-menu          → beach bars
/pool-bar/digital-menu      → pool bars
/room-service/qr-menu       → room service
/spa-menu                   → spa menus
```

### Cities (geo hubs — priority Greek destinations)
```
/rodos/qr-menu
/santorini/digital-menu
/athens/qr-menu
/thessaloniki/qr-menu
/corfu/digital-menu
/crete/qr-menu
... (~20–25 hub cities, same logic as MatchWork Phase H)
```

### Combos (city × vertical)
```
/rodos/estiatorio/qr-menu
/santorini/xenodocheio/digital-menu
/athens/beach-bar/qr-menu
```

Target: **~150–200 landing URLs** (quality over spam — no bulk 164-city grid).

### Landing page content (each page)
- Unique H1 + meta title/description
- 2–3 paragraphs unique copy (GR + EN hreflang)
- FAQ section (3–5 questions) → FAQPage JSON-LD
- Breadcrumbs → BreadcrumbList JSON-LD
- CTA: "Δοκίμασε δωρεάν" → signup
- Internal links via footer hub only (not header — anti-spam)

## Blog (topical authority)

```
/blog/pws-ftiaxno-qr-menu
/blog/digital-menu-vs-printed
/blog/qr-menu-eksοdoχειo
/blog/qr-menu-estiatorio
/blog/poliglosso-menu-touristes
...
```

Target: 10–15 launch articles, monthly additions.

## hreflang

| Content | Locales |
|---------|---------|
| Marketing pages | GR (default), EN, DE, FR |
| SEO landings | GR + EN minimum |
| Blog | GR primary, EN where translated |
| QR menus | Per-venue item translations (product feature, not hreflang) |

## noindex Rules

| URL pattern | Reason |
|-------------|--------|
| `/dashboard/*` | Private admin |
| `/login`, `/register` | Auth |
| `/api/*` | API |
| `/m/*` | Per-business menus (tenant content) |
| Filtered homepage URLs | Canonical to `/` only |

## IndexNow + GSC

- `scripts/submit-indexnow.mjs` — ping Bing/Yandex after deploy
- Google Search Console — submit sitemap, HTML verification file
- Deploy flag: `RUN_INDEXNOW=1`

## llms.txt

Public route listing all indexable pages, blog posts, landings, sitemap URL — for AI crawlers and IndexNow URL discovery.

## Performance (SEO-related)

- SSR/SSG for all marketing and landing pages
- Core Web Vitals target: LCP < 2.5s, SEO score 100
- Lazy images on QR menu (product UI, not marketing)

## Implementation Order

1. **Phase 1:** `seo.ts`, robots, sitemap (static pages), root JSON-LD, OG image
2. **Phase 1b:** First 20 landings + footer hub
3. **Phase 2:** Blog + remaining landings + IndexNow
4. **Ongoing:** GSC monitoring, new city/vertical pages based on Search Console data

## Do Not

- Index tenant QR menus or dashboard pages
- Create thin duplicate city pages (MatchWork anti-spam rule)
- Use AI-generated bulk content for landings
- Modify MatchWork SEO or servers
