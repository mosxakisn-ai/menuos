# MenuOS — Technical Architecture

> Last updated: June 2026.

## Monorepo Structure

```
menuos/
├── apps/
│   └── web/                      # Next.js 15 — single app, multiple route groups
│       ├── (marketing)/          # Landing, pricing, about, blog, SEO landings
│       ├── (auth)/               # Login, register, forgot password
│       ├── (dashboard)/          # Owner/staff admin panel
│       └── (menu)/               # Public QR menu — /m/[venueSlug]
├── packages/
│   ├── db/                       # Prisma schema, migrations, client
│   └── shared/                   # Types, validation (Zod), utils
├── services/
│   └── ocr/                      # Python FastAPI + Tesseract (Phase 3)
├── docs/                         # Project documentation
├── docker/
│   ├── Dockerfile.web
│   └── docker-compose.prod.yml
└── scripts/
    ├── server-deploy.sh
    └── submit-indexnow.mjs
```

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend + API | Next.js 15 App Router, TypeScript | SSR for marketing SEO; client for dashboard |
| UI | Tailwind CSS, shadcn/ui | Custom theme tokens |
| Database | PostgreSQL 16, Prisma | Multi-tenant with organizationId |
| Auth | NextAuth.js v5, JWT, bcrypt | Roles: ADMIN, MANAGER, STAFF |
| Real-time | Socket.io | Waiter call events to dashboard |
| Push | Web Push (VAPID) + Service Worker | Staff PWA notifications |
| Storage | Cloudflare R2 | Photos, logos — S3-compatible |
| Payments | Stripe Billing | Phase 2 — subscriptions |
| OCR | Python FastAPI, Tesseract, pdf2image | Phase 3 — separate container |
| Email | Resend | Welcome, password reset, invoices |
| Deploy | Docker Compose | Hetzner VPS |
| SSL/CDN | Caddy + Cloudflare | Let's Encrypt, caching |

## Route Groups

| Group | Example routes | Indexable |
|-------|----------------|-----------|
| Marketing | `/`, `/pricing`, `/about`, `/blog`, `/qr-menu`, `/rodos/qr-menu` | Yes |
| Auth | `/login`, `/register` | No |
| Dashboard | `/dashboard/*` | No |
| Public menu | `/m/hotel-x`, `/m/hotel-x?table=12` | No (private per business) |

## API Endpoints

```
/api/auth/*           Login, register, session
/api/organizations/*  Tenant management
/api/venues/*         Venue CRUD
/api/menus/*          Menu CRUD
/api/categories/*     Category CRUD + reorder
/api/items/*          Item CRUD + translations
/api/photos/*         Upload → Sharp WebP → R2
/api/waiter-call/*    Create call, list, update status
/api/opening-hours/*  Venue hours
/api/qr/*             Generate QR PNG/SVG
/api/ocr/*            Proxy to Python OCR service (Phase 3)
/api/billing/*        Stripe webhooks (Phase 2)
```

## Multi-Tenant Security

- Every DB table has `organizationId` (or joins through venue → organization).
- Middleware resolves tenant from session JWT.
- All API routes validate `organizationId` before queries.
- Public menu routes resolve venue by slug — no auth, read-only, scoped to one venue.

## Real-Time Architecture

```
Guest → POST /api/waiter-call → DB
                              → Socket.io emit to org room
                              → Dashboard receives event
                              → Web Push to subscribed staff devices
```

## Photo Pipeline

```
Upload (dashboard) → API → Sharp (resize + WebP) → R2 bucket → store URL in DB
Public menu → R2 CDN URL → lazy load + blur placeholder
```

## OCR / PDF Import

> **Full spec, benchmarks, roadmap:** [`docs/PDF-IMPORT.md`](./PDF-IMPORT.md)

Current implementation (Node.js, not separate Python container yet):

```
Upload PDF (dashboard) → classify pages (digital / scan / cover)
  → digital: pdf-parse embedded text
  → scan: render page → JPEG → OCR.space
  → rule-based parser + category normalize
  → MenuImportDocument JSON → review UI → save to DB
```

Legacy Phase 3 plan (Tesseract Python service) — optional future; see PDF-IMPORT roadmap.

No LLM in production yet. Vision path documented for Pro PDF when policy allows.

## Docker Compose (production)

```yaml
services:
  web:
    build: ./apps/web
    ports: ["3001:3000"]
    env_file: .env.production
    depends_on: [postgres]

  postgres:
    image: postgres:16-alpine
    volumes: [menuos_pg_data:/var/lib/postgresql/data]

  ocr:                          # Phase 3
    build: ./services/ocr
    ports: ["8001:8000"]
```

## Hosting

| Environment | Location |
|-------------|----------|
| Development | Local Docker Compose |
| Staging | Hetzner — `staging.menuos.gr` (future) |
| Production | Hetzner — `/opt/menuos` |

### Production server rules

- **Server:** Hetzner VPS (same machine as [MatchWork](https://matchwork.gr/) during early stage).
- **Isolation:** `/opt/menuos` only — separate docker-compose, separate PostgreSQL volume, separate app container.
- **Shared (read-only):** MatchWork Caddy reverse-proxies `menuos.gr` → `menuos-web:3000` on Docker network `matchwork_default`. MenuOS deploy **must not reload Caddy** unless the Caddyfile block changed (see `scripts/lib/caddy-reload.sh`).
- **Never modify:** `/opt/matchwork` app containers, MatchWork `.env`, or MatchWork Caddy blocks for other domains without explicit user approval.
- **Deploy impact:** Routine MenuOS deploy rebuilds/restarts **only** `menuos-web` + `menuos-postgres`. MatchWork (`matchwork.gr`) must stay up.
- **Domain:** `menuos.gr` → MatchWork Caddy → `menuos-web:3000`
- **Photos:** Cloudflare R2 (not on VPS disk).

## Development Workflow

1. Build and test locally.
2. Commit to git.
3. Deploy to `/opt/menuos` only when user approves.
4. Run IndexNow after deploy (optional env flag).

## Reference Implementation

SEO patterns copied from MatchWork (`C:\Users\rodos\PROJECTS\MatchWork`):
- `apps/web/src/lib/seo.ts`
- `apps/web/src/app/sitemap.ts`, `robots.ts`
- `apps/web/src/lib/seo-structured-data.ts`
- `apps/web/src/app/llms.txt/route.ts`
- `docs/SEO-ANALYSIS.md`

Adapt content for QR menu keywords, not job listings.
