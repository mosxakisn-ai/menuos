# MenuOS — SEO Strategy

> Modeled after [MatchWork](https://matchwork.gr/) production SEO stack (`docs/SEO-ANALYSIS.md` on MatchWork repo).  
> **Goal:** Lighthouse SEO **100**, GSC coverage, programmatic landings with quality copy — not bulk spam.

## Goals

Rank on Google for:

- Generic: "QR menu", "digital menu", "ψηφιακό menu εστιατορίου"
- Vertical: restaurant, hotel, beach bar, room service, spa, café, pizzeria, taverna…
- Geo: "QR menu Ρόδος", "digital menu Σαντορίνη", city × vertical combos
- Intent: "πώς φτιάχνω QR menu", "GDPR QR menu", "digital menu vs printed"

## MatchWork parity checklist

| Layer | MatchWork | MenuOS | Notes |
|-------|-----------|--------|-------|
| Central `lib/seo.ts` | ✅ | ✅ | `buildPageMetadata`, hreflang, OG, Twitter |
| Root metadata **without** duplicate alternates | ✅ | ✅ | Alternates per page only (fixes hreflang merge bug) |
| hreflang `el` + `en` + `x-default` via `?lang=` | ✅ | ✅ | Default locale: **EN** (clean URL) |
| `viewport` export in root layout | ✅ | ✅ | Lighthouse SEO audit |
| `icons` + `apple-icon` + `formatDetection` | ✅ | ✅ | Root metadata |
| `robots.ts` + sitemap | ✅ | ✅ | `/sitemap.xml` (~140 URLs) |
| Image sitemap + RSS | — | ✅ | `/sitemap-images.xml`, `/feed.xml` |
| JSON-LD Organization / WebSite | ✅ | ✅ | Root layout |
| JSON-LD FAQ + Breadcrumb + WebPage | ✅ | ✅ | Marketing + landings |
| JSON-LD Service | — | ✅ | Geo/vertical landings |
| JSON-LD Product/Offer | — | ✅ | Pricing |
| Programmatic landings (footer hub only) | ✅ ~260 | ✅ ~103 | Quality > volume |
| Blog topical clusters | ✅ 6+ | ✅ 30 | Greek-only hreflang |
| `llms.txt` | ✅ | ✅ | Markdown links + `text/markdown` |
| IndexNow post-deploy | ✅ | ✅ | Recursive sitemap fetch |
| Homepage filtered/UTM URLs → `noindex` | ✅ | ✅ | `lib/homepage-seo.ts` |
| GSC HTML verification | ✅ | ✅ | `googlef328fb99f5f1f5b1.html` |
| GSC meta verification | ✅ | ✅ | `GOOGLE_SITE_VERIFICATION` + code fallback |
| JSON-LD Article (blog posts) | ✅ | ✅ | `buildArticleSchema` |
| JSON-LD ItemList (blog index) | — | ✅ | Blog listing |
| Blog hreflang el-only | — | ✅ | `SEO_BLOG_LOCALES` until EN articles |
| Robots disallow staff/supervisor | — | ✅ | `/s/`, `/supervisor/`, station screens |
| WebSite bilingual inLanguage | — | ✅ | `el-GR` + `en-US` |
| Hero image delivery optimized | — | ✅ | Unsplash w=920/256/192 + menu resize |
| Lighthouse SEO target | **100** | **100** (target) | Run PageSpeed after deploy |
| Lighthouse Performance | 85 desktop | Improved | Hero + QR menu photo resize |

## Architecture

### Central library — `lib/seo.ts`

- `buildPageMetadata()` — title, description, keywords, canonical, hreflang, robots
- `buildRootMetadata()` — site-wide defaults; **strips alternates** (MatchWork pattern)
- `buildPrivatePageMetadata()` — `noindex` for dashboard/auth/QR menus
- `buildHreflangAlternates()` / `localeAbsoluteUrl()` — non-default locale → `?lang=`; **self-referencing canonical** from URL `?lang=` only (`getSeoUrlLocale`) — cookie/Accept-Language must not move it
- `SEO_BILINGUAL_LOCALES` — `["el", "en"]` for marketing + landings
- `absoluteUrl()`, `openGraphImageUrl(locale)`
- Open Graph + Twitter cards, `google-site-verification` from env

### Technical files

| File | Purpose |
|------|---------|
| `app/robots.ts` | Allow `/` + `/llms.txt`; disallow API/dashboard/auth/staff/QR (`/m/`); explicit Allow for GPTBot, ChatGPT-User, ClaudeBot, Google-Extended (same Disallow); sitemap + image sitemap |
| `lib/seo-sitemap.ts` | Priority/changefreq tiers by page kind |
| `app/sitemap.ts` | Single combined sitemap (~140 URLs) |
| `app/sitemap-images.xml/route.ts` | OG image sitemap |
| `app/feed.xml/route.ts` | Blog RSS |
| `app/opengraph-image.tsx` | Dynamic OG 1200×630 |
| `app/manifest.ts` | PWA manifest (`start_url: /`, locale-aware) |
| `app/icon.tsx` + `app/apple-icon.tsx` | Favicons |
| `app/llms.txt/route.ts` | AI/crawler discoverability |
| `lib/homepage-seo.ts` | `noindex` for `/?utm_*` etc.; `?lang=` allowed |

### JSON-LD (`lib/seo-structured-data.ts`)

| Schema | Where |
|--------|-------|
| Organization | Root layout |
| WebSite | Root layout |
| SoftwareApplication | Root layout (pricing bounds) |
| FAQPage | Marketing pages, landings |
| BreadcrumbList | Marketing, landings, blog (home = single crumb) |
| WebPage | Marketing, landings |
| Service | City/vertical landings |
| Product/Offer | Pricing page |

Public QR menus (`/m/*`) and dashboard → **noindex** + robots disallow.

## Programmatic landing pages

Config: `lib/seo-landing.ts` + copy `lib/seo-landing-content.ts`

### Verticals (16)

`/estiatorio/qr-menu`, `/xenodocheio/digital-menu`, `/beach-bar/qr-menu`, `/pool-bar/digital-menu`, `/room-service/qr-menu`, `/spa-menu`, `/cafeteria/qr-menu`, `/bar/qr-menu`, `/cocktail-bar/digital-menu`, `/winery/digital-menu`, `/cafe/qr-menu`, `/bakery/qr-menu`, `/food-truck/qr-menu`, `/pizzeria/qr-menu`, `/taverna/qr-menu`, `/canteen/qr-menu`, `/digital-menu`, `/live-360`

### Cities (37 hubs)

Rodos, Santorini, Athina, Thessaloniki, Korfu, Kriti, Mykonos, Paros, Naxos, Zakynthos, Chania, Kos, Lefkada, Halkidiki, Ios, Skiathos, Kalamata, Patra, Ioannina, Kavala, Milos, Rethymno, Iraklio, Sifnos, Larisa, Volos, Kefalonia, Syros, Tinos, Kastoria, Alexandroupoli, Preveza, Nafplio, Pylos, Loutraki, Arachova, Katerini

### Combos (city × vertical)

Curated only — e.g. `/rodos/estiatorio/qr-menu`, `/nafplio/taverna/qr-menu`. **No** 164-city bulk grid.

Each landing: unique H1/meta, FAQ + JSON-LD, footer hub links only (not main nav).

## Sitemap tiers (`lib/seo-sitemap.ts`)

| Tier | priority | changefreq | Examples |
|------|----------|------------|----------|
| Homepage | 1.0 | daily | `/` |
| Main services | 0.95 | weekly | `/qr-menu`, `/ypiresies`, `/live-360` |
| Pricing | 0.90 | monthly | `/pricing` |
| Vertical landings | 0.84 | monthly | `/estiatorio/qr-menu` |
| City landings | 0.80 | monthly | `/rodos/qr-menu` |
| City×vertical | 0.75 | monthly | `/rodos/beach-bar/qr-menu` |
| Blog index | 0.70 | weekly | `/blog` |
| Blog posts | 0.60 | monthly | `/blog/*` |
| Legal | 0.20 | yearly | `/terms`, `/privacy` |

## Blog (topical authority)

~33 articles — GDPR, HACCP, POS, allergens, seasonal menus, café/bakery, Live 360°, hotels, social media, buying guide, PDF import, Basic vs Pro, etc.  
Target: **2–4 new posts/month**, not 100 thin posts at once.

## hreflang

| Content | Locales |
|---------|---------|
| Marketing + landings | `el` + `en` via `?lang=`; default **EN** = clean URL |
| Blog | GR primary — `SEO_BLOG_LOCALES: ["el"]` only; EN shell without translated body |
| QR menus (`/m/*`) | Per-venue item translations (product feature, not hreflang) |

**Do not** add DE/FR hreflang until full marketing UI translations ship (guest QR already has DE/FR).

## noindex rules

| URL pattern | Reason |
|-------------|--------|
| `/dashboard/*` | Private admin |
| `/login`, `/register` | Auth |
| `/api/*` | API |
| `/m/*` | Tenant QR menus |
| `/s/*`, `/supervisor/*`, station screens | Staff / ops panels |
| `/?utm_*`, `/?ref=` etc. | Canonical `/` only (`homepage-seo.ts`) |
| Filtered listing URLs | N/A (no public job filters) |

## IndexNow + GSC

- Submit only `https://menuos.gr/sitemap.xml` — **not** `/qr-menu` or other HTML pages
- `scripts/submit-indexnow.mjs` — recursive sitemap index → page URLs
- `RUN_INDEXNOW=1` on deploy
- HTML verification: `public/googlef328fb99f5f1f5b1.html`
- Optional: `GOOGLE_SITE_VERIFICATION` in `.env`

## Performance (Lighthouse-related)

MatchWork desktop reference (Jul 2026): Performance 85, SEO **100**, Best Practices 100, Accessibility 91.

MenuOS actions:

- Fonts: `display: "swap"` (Manrope, Playfair)
- Explicit `viewport` export
- Reserve space for hero images (reduce CLS — target CLS < 0.1)
- SSR/SSG for all marketing and landing pages
- Lazy images on QR menu (product UI)

Run after deploy: [PageSpeed Insights](https://pagespeed.web.dev/) on `https://menuos.gr/`

## Implementation status

1. **Phase 1:** ✅ Core SEO stack
2. **Phase 1b:** ✅ Programmatic landings + footer hub
3. **Phase 2:** ✅ Blog (26) + city/vertical expansion
4. **Phase 2b:** ✅ Live 360° SEO pass
5. **Phase 3:** ✅ Sitemap tiers, RSS, image sitemap, Service schema (~140 URLs)
6. **Phase 4:** ✅ MatchWork Lighthouse parity (hreflang fix, viewport, icons, homepage noindex)
7. **Phase 5:** ✅ GSC meta verification + blog Article/ItemList JSON-LD + hero CLS reserve
8. **Phase 6:** ✅ PageSpeed images, llms.txt markdown, blog el-hreflang, robots staff routes, +4 blog posts
9. **Complete (technical SEO):** All MatchWork-parity items shipped — monitor GSC + add content monthly

## Post-launch (manual, not code)

- GSC: submit only `https://menuos.gr/sitemap.xml`
- PageSpeed Insights quarterly on `/` and `/qr-menu`
- 2–4 blog posts/month from Search Console queries
- DE/FR marketing hreflang when full UI translations ship

## Do not

- Index tenant QR menus or dashboard pages
- Create thin duplicate city pages (MatchWork anti-spam rule)
- Use AI-generated bulk content for landings
- Submit HTML pages as sitemaps in GSC
- Modify MatchWork servers or SEO files
