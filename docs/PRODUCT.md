# MenuOS — Product & Business Logic

> Last updated: June 2026. Source of truth for product scope and phasing.

## Vision

**MenuOS** = Shopify for QR menus. Business owner signs up, pays subscription, builds digital menu in minutes; guests scan QR on mobile browser.

One sentence: *Premium digital menu SaaS — QR scan, multi-language, call waiter, PDF import — no native app required.*

## User Roles

| Role | Access |
|------|--------|
| **Guest** | Public QR menu only — categories, products, languages, call waiter |
| **Staff** | Dashboard: waiter notifications, availability toggles |
| **Manager** | Full menu CRUD, photos, QR codes, opening hours |
| **Admin (owner)** | Everything + billing, staff accounts, branding |

## Core User Flows

### A — New business (B2B)
```
menuos.gr → pricing → signup → onboarding wizard (venue, first menu, QR download) → dashboard
```

### B — Guest (B2C)
```
Scan QR → menuos.gr/m/{venue}?table=12 → language → menu → category → product → [Call Waiter]
```

### C — Staff
```
Login → dashboard → real-time waiter panel → mark handled / toggle availability
```

## Feature Scope (from spec)

### Customer QR frontend
- Mobile-first, responsive
- Categories, products (photo, name, price, description, ingredients, allergens)
- 4 languages: GR, EN, DE, FR
- Table/room via URL param (`?table=12`, `?room=305`)
- Call Waiter button
- Opening hours, offers/specials
- Lazy loading, offline cache (Service Worker)

### Admin dashboard
- Auth + roles (Admin, Manager, Staff)
- Product/category CRUD + drag-drop reorder
- Real-time price/description editing
- Photo upload → auto WebP (Sharp)
- Multi-language fields per product
- Availability toggle (in stock / out of stock)
- QR Manager (PNG/SVG, custom colors)
- Waiter notifications panel (real-time)
- Opening hours manager
- Multi-menu (Breakfast, Pool Bar, Restaurant, Room Service, Spa, Activities)

### Backend
- REST API: products, categories, menu, photos, waiter-call, opening-hours, languages, auth
- WebSocket gateway for notifications
- JWT, RBAC, rate limiting, input validation (Zod)

### OCR / PDF import

> **Λεπτομέρειες, pipeline, roadmap:** [`docs/PDF-IMPORT.md`](./PDF-IMPORT.md)

- PDF upload → hybrid extract (digital + OCR.space) → rule parser → **Gemini Vision** (OCR pages) → review → DB
- Pro plan feature; scanned menus need `OCR_SPACE_API_KEY` + `GEMINI_API_KEY` for best results
- Vision AI: **Pro PDF import only** — not used elsewhere in product

## Data Model (core)

```
Organization (tenant, billing, plan)
  User (email, password, role)
  Subscription (Stripe)
  Venue (restaurant/hotel property)
    Menu (type: breakfast, pool_bar, restaurant, room_service, spa, activities)
      Category (name, order)
        Item (price, photo_url, available)
          ItemTranslation (lang, name, description, ingredients, allergens)
    WaiterCall (table_number, room, status, timestamp)
    Setting (brand_name, logo_url, colors, opening_hours)
  Photo (item_id, url, optimized_url)
```

Prefer `item_translations` table over flat `lang_gr/en/de/fr` columns.

## Pricing (proposed)

| Plan | Price | Includes |
|------|-------|----------|
| Trial | €0 / 7 days | 1 venue, 1 menu, 50 items |
| Basic | €9.99/mo | 1 venue, 3 menus, unlimited items, QR |
| Pro | €19.99/mo | 3 venues, unlimited menus, PDF import, call waiter |
| Enterprise | Custom | Custom domain, white-label, priority support |

Stripe Billing in Phase 2.

## Phasing

### Phase 1 — MVP (weeks 1–4)
Landing, signup/login, org+venue setup, menu CRUD, photo upload, public QR menu, QR generator, basic branding, GR+EN. **No Stripe, OCR, push yet.**

### Phase 2 — Monetization + real-time (weeks 5–6)
Stripe subscriptions, call waiter, WebSocket dashboard, Web Push PWA, table param, opening hours, roles.

### Phase 3 — Power features (weeks 7–8)
PDF OCR pipeline, drag-drop, DE+FR, multi-menu, offers, offline cache, custom QR colors.

### Phase 4 — Growth (ongoing)
Custom domain per venue, analytics, tablet view, white-label, public API.

## Quality Bar

- Load: < 1.5s first paint on QR menu
- UX: max 2 taps for any guest action
- UI: premium hospitality tech — not generic template
- SEO: MatchWork-level (see `SEO-STRATEGY.md`)
- Tenant isolation: user A never sees user B data (tested)

## Out of Scope (for now)

- Native mobile apps (App Store / Play Store)
- Online ordering / payment processing
- AI chatbot or AI menu suggestions
- Kitchen POS integration
