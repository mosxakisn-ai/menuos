/** English SEO copy — alternate hreflang for marketing pages. */
export const SEO_SITE_EN = {
  locale: "en_US",
  language: "en",
  defaultTitle: "MenuOS — Digital QR menu & Live 360° for restaurants & hotels",
  description:
    "Digital QR menu and Live 360° coordination for restaurants, hotels and bars in Greece. Guests scan — you update online in minutes.",
  breadcrumbHome: "Home",
} as const;

export const SEO_PAGES_EN = {
  home: {
    title: "Digital QR menu & Live 360° — restaurants, hotels & bars",
    description:
      "QR menu and Live 360° coordination in one platform. Multilingual menu, call waiter, online price updates — no app for guests. Free {trialDaysAdj} trial.",
    path: "/",
    breadcrumbLabel: "Home",
  },
  qrMenu: {
    title: "QR menu & Live 360° for restaurants & hotels",
    description:
      "QR menu with Live 360° coordination: guests scan, see photos and prices — you update online and track calls live in your panel.",
    path: "/qr-menu",
    breadcrumbLabel: "QR Menu",
  },
  services: {
    title: "Services — Digital menu, Live 360° & QR codes",
    description:
      "MenuOS services: digital menu, QR codes, Live 360°, multiple languages, call waiter — for restaurants and hotels.",
    path: "/ypiresies",
    breadcrumbLabel: "Services",
  },
  howItWorks: {
    title: "How it works — QR menu & Live 360°",
    description:
      "How to get started with MenuOS: sign up, build your menu, QR on tables, Live 360° for calls and orders. Simple steps for restaurants and hotels.",
    path: "/pos-leitourgei",
    breadcrumbLabel: "How it works",
  },
  pricing: {
    title: "Pricing — QR menu & Live 360° from {basicPrice}/month",
    description:
      "MenuOS pricing: free {trialDaysAdj} trial with Live 360°, Basic {basicPrice}/month, Pro {proPrice}/month. QR menu, call waiter, live panel — no hidden fees.",
    path: "/pricing",
    breadcrumbLabel: "Pricing",
  },
  about: {
    title: "About — MenuOS & Live 360° for the Greek market",
    description:
      "MenuOS was built for restaurants and hotels in Greece: QR menu, Live 360° coordination and simple management without complexity.",
    path: "/sxetika",
    breadcrumbLabel: "About",
  },
  contact: {
    title: "Contact — Support & Enterprise",
    description:
      "Contact the MenuOS team for a trial, Enterprise pricing or support. Tel. +30 210 700 0925, info@qrmenus.info",
    path: "/epikoinonia",
    breadcrumbLabel: "Contact",
  },
  terms: {
    title: "Terms of use",
    description: "Terms of use for the MenuOS platform (menuos.gr) for hospitality businesses.",
    path: "/terms",
    breadcrumbLabel: "Terms of use",
  },
  privacy: {
    title: "Privacy policy",
    description: "How MenuOS collects and protects personal data for business owners and menu visitors.",
    path: "/privacy",
    breadcrumbLabel: "Privacy policy",
  },
} as const;

export const SEO_HOME_FAQ_EN = [
  {
    q: "Does the guest need an app?",
    a: "No. They scan the QR code and the menu opens in the browser on their phone.",
  },
  {
    q: "How fast can I go live?",
    a: "With a basic menu, usually in under an hour. The trial is {trialDays}.",
  },
  {
    q: "Does it work for hotels?",
    a: "Yes — pool bar, breakfast, room service, separate menu per area or table.",
  },
  {
    q: "How many languages are supported?",
    a: "Greek, English, German and French on the guest QR menu.",
  },
  {
    q: "What is MenuOS Live · 360°?",
    a: "Live coordination of calls and orders from the QR menu — see what happens in your venue in real time, without a separate system.",
  },
] as const;

export const SEO_QR_MENU_FAQ_EN = [
  {
    q: "What is a QR menu?",
    a: "A digital menu that opens when the guest scans a QR code with their phone. No app required.",
  },
  {
    q: "Does it work for hotels?",
    a: "Yes — pool bar, breakfast, room service, spa. Separate menu per area or table.",
  },
  {
    q: "How many languages are supported?",
    a: "Multiple languages on the QR menu — switch with one tap.",
  },
  {
    q: "Can I change prices quickly?",
    a: "Yes. Update from your online panel and guests see the change immediately.",
  },
  {
    q: "What is Live 360°?",
    a: "Live panel for waiter calls and orders from QR — track waiting, stations and completions in real time.",
  },
] as const;

export const SEO_PRICING_FAQ_EN = [
  {
    q: "Do I need a credit card for the trial?",
    a: "No. The {trialDaysAdj} trial starts with email and OTP verification.",
  },
  {
    q: "Can I change plan later?",
    a: "Yes. Upgrade Basic or Pro from the billing panel. Contact us for Enterprise.",
  },
  {
    q: "What does Enterprise include?",
    a: "Custom domain, white-label, multiple locations, priority support — quote per project.",
  },
  {
    q: "Is there a long-term commitment?",
    a: "No. Monthly subscription, cancel anytime.",
  },
  {
    q: "Is Live 360° included?",
    a: "Yes — on trial, Basic and Pro. Live call panel and coordination with no extra charge.",
  },
] as const;

export const SEO_PRICING_OFFERS_EN = [
  { name: "{trialDaysGen} trial", price: 0, description: "1 location, QR menu, Live 360°, 50 items" },
  { name: "Basic", price: 9.99, description: "1 location, 3 menus, Live 360°, unlimited items" },
  { name: "Pro", price: 19.99, description: "3 locations, Live 360°, unlimited menus" },
] as const;
