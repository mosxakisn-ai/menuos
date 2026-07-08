# MenuOS — Live 360° Operations (KDS, Οθόνες, Staff)

> Last updated: July 2026. **Source of truth** for pass/waiter logic, zones, posts, and staff routing.
> Code helpers: `packages/shared/src/venue-staff-member.ts`, `station-spot-zones.ts`, `kds-station-screen.ts`

## What Live 360° is

Pro feature: real-time coordination between **guest QR menu**, **floor waiters (phones)**, **kitchen/bar tablets (KDS)**, and **manager spot map (Οθόνες)** — via HTTP polling (~5s) + Web Push. No native app, no Socket.io in production.

---

## Setup order (Ρυθμίσεις)

Owner configures in this order:

1. **Χώροι / θέσεις** — tables, rooms, sunbeds (`VenueSpot`). Zones (Σάλα, Αυλή, Όροφος) are **derived** from label prefixes or grouping, not typed separately.
2. **Πόστα** — logical stations: `kitchen`, `bar`, `cold`, `dessert`, `services`, support posts. Each post can have optional `zoneId` (which KDS zone tab it appears under).
3. **Μηνύματα** — quick chips per post (e.g. «Έλα Πάσο», «Πάρε πάγο»). Owner-defined; no AI defaults in product.
4. **Προσωπικό** — people linked to a post + zone (waiters) or tablet post (KDS).

---

## Concepts (business ↔ code)

| Concept | UI (GR) | Meaning |
|---------|---------|---------|
| **Χώρος / zone** | Σάλα, Αυλή, Όροφος | Area of the venue; filters tables, pending lists, waiter scope |
| **Πόστο / post** | Κουζίνα Σάλας, Services Αυλή | Station assignment; determines KDS chips and who receives what |
| **Θέση / spot** | Τραπέζι 12, Δωμάτιο 101 | Physical seat; bound to QR `?table=12` |
| **Σερβιτόρος** | Ρόλος κινητού | Floor staff — receives pass alerts + guest calls |
| **Tablet πάσου** | KDS / BDS / … | Kitchen/bar screen — **sends** pass signals, does not receive them as waiter |

### Staff assignment types

| Assignment | Device | Link pattern |
|------------|--------|--------------|
| `services` or services post id (e.g. `svc-sala`) | Phone | `/s/{venueSlug}?key={memberToken}&zone={zoneId}` |
| `all` | Phone (all zones) | same + `zone=all` or omitted |
| Pass post id / `pass-all` | Tablet | `/kds?venueSlug=…&key={screenToken}` (+ `allPosts=1` optional) |

Each staff member has a **unique `memberToken`** — share link from Ρυθμισεις → Προσωπικό. Push opens their personal URL with zone pre-selected.

**Effective zone** for a waiter = post's `zoneId` if set, else member's `zoneId`. Used for filtering who receives KDS sends.

---

## Two parallel signal types

### 1. Guest waiter calls (`WaiterCall`)

- **Source:** Guest QR menu — κλήση σερβιτόρου, λογαριασμός, παραγγελία
- **Statuses:** `PENDING` → `ACKNOWLEDGED` → `COMPLETED`
- **Who sees:** Floor waiters (`services` / services post ids), manager Οθόνες
- **API:** `/api/waiter-call`

### 2. Pass signals (`PassSignal`)

- **Source:** KDS/bar tablet — quick message to a table (e.g. «Πάρε πάγο», «Έλα Πάσο»)
- **Statuses:** `READY` → `PICKED_UP` → `DELIVERED` (or `CANCELED` from KDS)
- **Who sees:** Floor waiters on phone + manager Οθόνες; kitchen sees own outbound in pending strip
- **API:** `/api/pass-signals`, context `/api/station-screen/context`

**Sidebar badge (Οθόνες nav):** counts **organization-wide** = all `PENDING` waiter calls + all `READY` pass signals across **all venues**. Zone cards on Οθόνες page count **current venue only**. Show cross-venue hint when sidebar total ≠ venue total.

---

## KDS tablet flow (kitchen / bar / cold / dessert)

Routes: `/kds`, `/bar`, `/cold`, `/dessert` — query `venueSlug`, `key` (screen token), optional `allPosts=1`.

### UI layout

- **Left:** Logo, venue, today count (venue-wide, all zones), **message chips** (vertical, scroll arrows if many)
- **Top row:** Pending signals filtered by **active zone tab**
- **Center:** Zone tabs → post tabs (if multiple in zone) → **table grid** (scroll arrows if overflow)
- **Footer:** Selected table + message text field + **Αποστολή**

### Intended send flow (manual — never auto-send on chip tap)

1. Pick **zone tab** (Σάλα / Αυλή / Όροφος) — filters tables, pending header, posts
2. Pick **post tab** (e.g. Κουζίνα Σάλας / Bar Σάλα) — determines **sidebar chips only for that post**
3. Tap **table** on grid
4. Tap **message chip** — fills footer text (does NOT send)
5. Tap **Αποστολή** → **recipient popup** (premium dark modal)

### Recipient popup

- Lists **floor waiters only** for the active zone (not KDS tablets, not waiters from other zones)
- «Όλοι» or pick individuals
- Creates `PassSignal` in DB (visible on Οθόνες for matching zone)
- Web Push to selected staff `memberToken` subscriptions with personalized `/s/…` URL
- If no waiters configured: still creates signal; shows on Οθόνες; no push targets

### Zone without post

If a zone has tables but **no post assigned** (e.g. Όροφος): **no message chips**, no send — copy explains «Δεν έχεις πόστο εδώ». Do not fall back to merged messages from other zones.

### Key files

- UI: `apps/web/src/components/dashboard/station-pass-screen.tsx`
- Recipients: `apps/web/src/lib/kds-pass-recipients.ts`, `kds-send-recipients-dialog.tsx`
- Shared: `kds-station-screen.ts`, `staffMemberEligibleForKdsPassNotify()`

---

## Οθόνες — manager spot map (`/dashboard/waiter`)

Greek UI label: **Οθόνες** (not «waiter panel» to users).

### Zone picker

When venue has multiple zones:

- Cards show **message count** (large number, amber) when zone has pending activity; otherwise **seat count**
- Cyan banner: «N μηνύματα — πήγαινε εδώ: Σάλα (2) · Αυλή (1)»
- Auto-selects zone with most pending on first load
- If sidebar badge > 0 but current venue = 0: amber hint to **switch venue** (messages are at another store)

### What counts as «pending» on zone cards

- Guest calls with status `PENDING`
- Pass signals with status `READY` (not `PICKED_UP` — those show on grid but not in zone pending badge)

Zone matching uses `zoneIdForWaiterLocationView()` — improved matching for bare table numbers when unambiguous.

### Table grid

Per spot: guest call state, pass message text, actions (Accept / Done, OK / Delivered).

---

## Push notification routing

- **Waiter call created** → push to floor staff (`waiterCallsVisibleToStaffMember`)
- **Pass signal created** → push to selected recipients (KDS popup) or all matching subs if no filter
- Each push URL is **personalized** via `staffMemberAccessUrlFromScreens()` → waiter's `/s/…?key=…&zone=…`
- Subscriptions tied to `staffMemberId` when staff enables notifications on their device
- Web Push options: `TTL: 3600`, `urgency: high`

---

## Sound & voice (why two paths)

| State | Beep | Voice (pass only) |
|-------|------|-------------------|
| Panel **focused + visible** | Page Web Audio (`waiter-alert.ts`) | Page: Android Web Speech · **iOS server WAV** (`/api/pass-announcement-audio`) |
| **Background / locked** | SW `playBeepInSw()` + **notification OS sound** (`waiter-beep.wav`) | SW fetches same TTS API |

Service worker (`apps/web/public/sw.js`, bump `menuos-sw-v*` on changes):

- `postMessage` to page **only** if `focused && visibilityState === 'visible'`
- Else SW handles beep/TTS — page audio fails on lock screen

**iPhone:** Push + reliable alerts require **Safari → Add to Home Screen**. Chrome iOS tab = polling only when open, no push.

**Android:** Installed PWA + push; disable battery optimization for Chrome if SW sleeps.

**Org setting:** `notificationSettings.voiceMessagesEnabled` — toggles pass TTS, not guest-call beep alone.

**Agent rule:** `.cursor/rules/menuos-staff-alerts.mdc`

---

## Common pitfalls (for agents)

| Symptom | Cause |
|---------|--------|
| Sidebar «2» but Οθόνες shows quiet | Badge is **org-wide**; viewing wrong **venue** or messages in another store |
| KDS shows bar messages on Όροφος | Bug if `postsForZone.length === 0` still merged `allQuickComments` — must show empty state |
| Waiter with post id doesn't get push | Must use targeted notify list; `passSignalVisibleToStaffMember` must treat services post ids as waiters |
| Zone card shows seats not messages | `activePending === 0` for that venue/zone — check venue selector |
| «Σήμερα: N ειδοποιήσεις» on KDS | Venue-wide total today, **not per zone** — label clarifies «όλοι οι χώροι» |
| Μπιπ αλλά όχι φωνή iPhone | Web Speech blocked — must use server WAV; user must tap once to unlock audio |
| Ήχος σταματά κλειδωμένο κινητό | Panel was "visible" but not focused — SW must beep; check push + notification sound settings |
| Chrome iPhone δεν push | Expected — Safari PWA only |

---

## API quick reference

| Endpoint | Purpose |
|----------|---------|
| `GET /api/station-screen/context` | KDS data: spots, signals, posts, chips |
| `GET /api/station-screen/recipients` | Eligible waiters for send popup (zone-filtered) |
| `POST /api/pass-signals` | Create pass signal; optional `zoneId`, `notifyStaffMemberIds[]` |
| `GET /api/pass-signals?venueId=` | Staff/manager poll pass signals |
| `GET /api/waiter-call?venueId=` | Staff/manager poll guest calls |
| `GET /api/dashboard/pending-calls` | Sidebar badge; returns `{ pendingCount, byVenue }` |

---

## Demo URLs

- Guest menu: `https://menuos.gr/m/demo-taverna?table=12`
- KDS (needs valid screen key): `https://menuos.gr/kds?venueSlug=demo-taverna&key=…`
- Waiter phone: `https://menuos.gr/s/demo-taverna?key={memberToken}&zone=main`
