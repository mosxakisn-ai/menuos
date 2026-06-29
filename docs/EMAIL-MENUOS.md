# Email — MenuOS (ίδιο infrastructure με MatchWork)

| | MatchWork | MenuOS |
|---|---|---|
| SMTP mailbox | `admin@s1cloud.b-os.gr` | **Ίδιο** |
| From header | `MatchWork <admin@s1cloud.b-os.gr>` | `MenuOS <admin@s1cloud.b-os.gr>` |
| SMTP server | `smtp.office365.com:587` | **Ίδιο** |
| Admin alerts | `info@b-os.gr` | **Ίδιο** (`MENUOS_NOTIFY_EMAIL`) |

Το **ίδιο mailbox** στέλνει και τα δύο προϊόντα — ξεχωρίζεις από το **From name** (MatchWork vs MenuOS) και το **subject** (`MatchWork — …` vs `MenuOS — …`).

---

## Env vars (`/opt/menuos/.env`)

```env
MAILBOX_USER=admin@s1cloud.b-os.gr
MAILBOX_PASSWORD=...          # ίδιο password με MatchWork
SMTP_FROM="MenuOS <admin@s1cloud.b-os.gr>"
MENUOS_NOTIFY_EMAIL=info@b-os.gr
```

---

## Τι emails στέλνονται

| Event | Προς πελάτη | Προς admin (info@b-os.gr) |
|-------|-------------|---------------------------|
| Εγγραφή | Welcome + trial info | Νέα εγγραφή πελάτη |
| Συνδρομή (Stripe/mock) | Plan activated | Νέα πληρωμή συνδρομής |

Χωρίς SMTP config: logs στο console (dev) — δεν σπάει η εγγραφή/checkout.

---

## Production

Αν το MatchWork στέλνει ήδη email, αντέγραψε τα ίδια `MAILBOX_*` vars στο MenuOS `.env` και restart:

```bash
docker compose -f docker-compose.prod.yml up -d menuos-web
```
