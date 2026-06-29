# MenuOS

**Domain:** [menuos.gr](https://menuos.gr)

Premium SaaS QR menu platform for restaurants, hotels, and hospitality venues.

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/PRODUCT.md](docs/PRODUCT.md) | Business logic, user flows, phasing, pricing |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, monorepo, API, hosting, multi-tenant |
| [docs/SEO-STRATEGY.md](docs/SEO-STRATEGY.md) | SEO landings, JSON-LD, sitemap (MatchWork pattern) |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Colors, typography, components, premium UI bar |
| [docs/DOMAIN.md](docs/DOMAIN.md) | menuos.gr URLs, DNS, env vars, QR links |

## Cursor Rules

`.cursor/rules/menuos-core.mdc` — always-on context for AI agents (constraints, stack, doc pointers).

## Key Constraints

- **Multi-tenant SaaS** — signup, subscription, dashboard, public QR menu
- **No AI** — OCR via Tesseract + rules only
- **No native app** — web + PWA + Web Push
- **Never touch MatchWork server** without explicit approval
- **Premium UI** — Deep Blue `#1A2A6C` + Silver `#C0C0C0`

## Status

Phase 1 scaffold complete — local dev ready.

```bash
# Start PostgreSQL
docker compose up -d

# Push schema (first time)
npm run db:push

# Dev server
npm run dev
```

Open http://localhost:3000
