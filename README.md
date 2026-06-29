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
| [docs/STRIPE-MENUOS.md](docs/STRIPE-MENUOS.md) | Stripe setup, `app=menuos` metadata, billing |
| [docs/EMAIL-MENUOS.md](docs/EMAIL-MENUOS.md) | SMTP (admin@s1cloud.b-os.gr), admin alerts |

## Cursor Rules

`.cursor/rules/menuos-core.mdc` — always-on context for AI agents (constraints, stack, doc pointers).

## Key Constraints

- **Multi-tenant SaaS** — signup, subscription, dashboard, public QR menu
- **No AI** — OCR via Tesseract + rules only
- **No native app** — web + PWA + Web Push
- **Never touch MatchWork server** without explicit approval
- **Premium UI** — Deep Blue `#1A2A6C` + Silver `#C0C0C0`

## Git branches

| Branch | Purpose |
|--------|---------|
| `dev` | Daily development — push/PR here |
| `main` | Production — auto-deploys to menuos.gr |

Flow: work on `dev` → merge to `main` when ready → GitHub Actions deploys to Hetzner.

### First-time server setup

On the server (as root), after the GitHub repo exists:

```bash
# Add deploy key (once): /root/.ssh/github_menuos → GitHub repo Deploy keys
GITHUB_REPO=git@github.com:mosxakisn-ai/menuos.git bash scripts/server-git-init.sh
```

GitHub Actions secrets (org or repo): `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY` (same as MatchWork).

## Status

Phase 1 scaffold complete — live at menuos.gr.

```bash
# Start PostgreSQL
docker compose up -d

# Push schema (first time)
npm run db:push

# Dev server
npm run dev
```

Open http://localhost:3000
