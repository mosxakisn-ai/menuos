# Stripe — MenuOS (ξεχωριστό από MatchWork / GoFleet)

Το **Stripe account ανήκει στην CloudEra** — ίδιο account, **διαφορετικό προϊόν**.

| | MatchWork | MenuOS |
|---|---|---|
| API key | `MATCHWORK_STRIPE_SECRET_KEY` | `MENUOS_STRIPE_SECRET_KEY` |
| Webhook URL | `matchwork.gr/api/billing/webhook` | `menuos.gr/api/billing/webhook` |
| Metadata | `app = matchwork` | **`app = menuos`** |
| Statement suffix | `MATCHWORK` | **`MENUOS`** |

**Μην βάλεις keys του MatchWork στο MenuOS.**

---

## 1. Restricted API key (Stripe Dashboard)

1. **Developers → API keys → Create restricted key**
2. Όνομα: **`MenuOS Production`**
3. Permissions: Checkout Sessions Write, Webhook Endpoints Write
4. Αντέγραψε το `sk_live_...`

## 2. Webhook setup

```bash
MENUOS_STRIPE_SECRET_KEY=sk_live_... node scripts/setup-menuos-stripe.mjs
```

Events: `checkout.session.completed`, `customer.subscription.deleted`

## 3. Production server (`/opt/menuos/.env`)

```env
MENUOS_STRIPE_SECRET_KEY=sk_live_xxxxxxxx
MENUOS_STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

```bash
docker compose -f docker-compose.prod.yml up -d menuos-web
```

## 4. Verify

```bash
curl -s https://menuos.gr/api/billing
```

```json
{
  "stripeEnabled": true,
  "app": "menuos",
  "platform": "menuos.gr",
  "stripeFilter": "metadata.app = menuos"
}
```

---

## Πώς βλέπεις από πού ήρθαν τα χρήματα

| Πεδίο | MenuOS τιμή |
|---|---|
| `metadata.app` | `menuos` |
| `metadata.platform` | `menuos.gr` |
| `metadata.source` | `menuos_subscription` |
| `client_reference_id` | `menuos:sub:{organizationId}:{planId}` |
| Product name | `MenuOS — Basic (monthly)` |
| Statement suffix | `MENUOS` |

**Stripe Dashboard → Payments → Filter → Metadata → `app` = `menuos`**

---

## Plans

| Plan | Price | Stripe |
|------|-------|--------|
| Trial | €0 / 7 days | No checkout |
| Basic | €29/mo | Checkout subscription |
| Pro | €79/mo | Checkout subscription |
| Enterprise | Custom | Contact sales |

Upgrade: `/dashboard/billing`
