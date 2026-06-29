# MenuOS — Domain & URLs

## Production

| Purpose | URL |
|---------|-----|
| Marketing / SaaS site | `https://menuos.gr` |
| Login | `https://menuos.gr/login` |
| Signup | `https://menuos.gr/register` |
| Dashboard | `https://menuos.gr/dashboard` |
| Public QR menu | `https://menuos.gr/m/{venueSlug}` |
| QR with table | `https://menuos.gr/m/{venueSlug}?table=12` |
| QR with room | `https://menuos.gr/m/{venueSlug}?room=305` |
| Sitemap | `https://menuos.gr/sitemap.xml` |
| Robots | `https://menuos.gr/robots.txt` |
| llms.txt | `https://menuos.gr/llms.txt` |

## Environment variables

```env
APP_URL=https://menuos.gr
NEXTAUTH_URL=https://menuos.gr
```

Local development: `http://localhost:3000`

## Staging (future)

`https://staging.menuos.gr`

## DNS (production)

- `menuos.gr` → Hetzner VPS (A record)
- Cloudflare proxy recommended (CDN + DDoS)
- SSL via Caddy Let's Encrypt

## Caddy routing (on server — MenuOS block only)

```
menuos.gr, www.menuos.gr {
    reverse_proxy menuos-web:3000
}
```

`www.menuos.gr` → redirect to `menuos.gr` (canonical).

## QR codes

Each venue gets URLs like:
```
https://menuos.gr/m/hotel-marine?table=12
```

QR PNG/SVG generated in dashboard points to this URL.

## Custom domain (Enterprise — Phase 4)

Optional per-venue: `menu.hotel-x.gr` → CNAME to MenuOS (white-label).

## IndexNow

```env
INDEXNOW_HOST=menuos.gr
APP_URL=https://menuos.gr
```

Key file: `https://menuos.gr/{INDEXNOW_KEY}.txt`

## Google Search Console

Verify `menuos.gr` (HTML file or DNS TXT). Submit `https://menuos.gr/sitemap.xml`.
