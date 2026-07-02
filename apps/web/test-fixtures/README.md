# PDF test fixtures

Δείγματα για επαναλαμβανόμενη δοκιμή εισαγωγής καταλόγου.

| Αρχείο | Περιγραφή |
|--------|-----------|
| `pdf/stegnakozas-menu-25.pdf` | Σαρωμένο μενού πελάτη (Stegna Kozas) — 6 σελίδες, χωρίς embedded κείμενο |

## Γρήγορη δοκιμή

Από root του monorepo (χρειάζεται `OCR_SPACE_API_KEY` στο `.env`):

```bash
npm run test:pdf-import -w @menuos/web
```

Ή με άλλο PDF:

```bash
npm run test:pdf-import -w @menuos/web -- path/to/menu.pdf
```
