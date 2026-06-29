# MenuOS — UI/UX Design System

> Premium, modern, contemporary. Not a generic QR menu template.

## Brand Identity

**Name:** MenuOS  
**Tagline (draft):** *Digital menus, elevated.*  
**Feel:** Premium hospitality technology — like a high-end hotel app, not a PDF in a browser.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Deep Blue | `#1A2A6C` | Primary, sidebar, headers, buttons gradient start |
| Silver | `#C0C0C0` | Accent, icons, borders, gradient end |
| White | `#FFFFFF` | Backgrounds |
| Soft Gray | `#F5F5F5` | Surfaces, cards background alt |
| Success Green | `#2ECC71` | Available, success states |
| Warning Orange | `#F39C12` | Out of stock, alerts |

### Gradients
- Primary button: `Deep Blue → Silver` (subtle, left to right)
- Hero backgrounds: Deep Blue with soft silver highlights

## Typography

| Role | Font | Usage |
|------|------|-------|
| Menu titles | **Playfair Display** (serif) | Category names, product names on QR menu |
| UI / OS | **Inter** (sans-serif) | Dashboard, buttons, body, forms |
| Buttons | Inter SemiBold | All CTAs |

Load via `next/font/google`.

## Components

| Component | Spec |
|-----------|------|
| Buttons | 8px radius, gradient primary, ghost secondary |
| Cards | White, soft shadow (`shadow-md`), 12px radius |
| Modals | Centered, dark overlay 60% |
| Dashboard nav | Left sidebar Deep Blue, icons Silver |
| Tables | Zebra rows, sticky header |
| Forms | 12px padding inputs, clear labels above |
| Product grid | 2-col mobile, 3-col tablet+ — large tap targets |

## Layout

### Dashboard
```
┌──────────┬─────────────────────────────┐
│ Sidebar  │ Top bar (venue name, user)  │
│ (nav)    ├─────────────────────────────┤
│          │ Content grid                │
└──────────┴─────────────────────────────┘
```

### Customer QR menu (mobile-first)
```
┌─────────────────────────┐
│ Header (logo, lang)     │
├─────────────────────────┤
│ Category tabs / list    │
├─────────────────────────┤
│ Product grid            │
│ [photo] name    €12.00  │
├─────────────────────────┤
│ [Call Waiter] FAB       │
└─────────────────────────┘
```

Product detail: full-screen modal or slide-up sheet — large photo, description, allergens.

## UX Rules

1. **2-click maximum** for any guest action (category → product = 2 taps)
2. **Instant feedback** — loading skeletons, success toasts, optimistic UI where safe
3. **Clear hierarchy** — one primary action per screen
4. **No clutter** — whitespace is premium
5. **Mobile-first** — design at 375px, scale up
6. **Dark mode** (optional Phase 3) — for evening dining contexts

## Motion

- Subtle transitions (150–200ms ease)
- Page transitions on QR menu category switch
- Waiter call button: brief pulse on press + confirmation toast
- No heavy animations — performance first

## Premium Bar

| Metric | Target |
|--------|--------|
| First paint (QR menu) | < 1.5s |
| Touch target | min 44×44px |
| Contrast | WCAG AA minimum |
| Feel | "Worth €79/month" |

## Tailwind Config

Extend theme with:
```js
colors: {
  primary: { DEFAULT: '#1A2A6C', foreground: '#FFFFFF' },
  accent: { DEFAULT: '#C0C0C0', foreground: '#1A2A6C' },
  surface: '#F5F5F5',
  success: '#2ECC71',
  warning: '#F39C12',
}
fontFamily: {
  serif: ['Playfair Display', 'serif'],
  sans: ['Inter', 'sans-serif'],
}
borderRadius: {
  card: '12px',
  button: '8px',
}
```

## shadcn/ui

Use shadcn components as base, override with MenuOS tokens. Prefer composition over custom one-offs.
