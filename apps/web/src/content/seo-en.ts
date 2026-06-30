/** English SEO copy — alternate hreflang for marketing pages. */
export const SEO_SITE_EN = {
  locale: "en_US",
  language: "en",
  defaultTitle: "MenuOS — Digital QR menu for restaurants & hotels",
  description:
    "Digital QR menu for restaurants, hotels and bars in Greece. Guests scan, browse prices and photos — you update the menu online in minutes.",
  breadcrumbHome: "Home",
} as const;

export const SEO_PAGES_EN = {
  home: {
    title: "Digital QR menu — restaurants, hotels & bars",
    description:
      "Build a digital QR menu in minutes. Multilingual, easy price updates, no app for guests. Free 7-day trial for hospitality businesses.",
    path: "/",
    breadcrumbLabel: "Home",
  },
  qrMenu: {
    title: "QR menu for restaurants & hotels",
    description:
      "Create a QR menu for your restaurant or hotel. Guests scan from their phone, see photos and prices — you update online.",
    path: "/qr-menu",
    breadcrumbLabel: "QR Menu",
  },
  services: {
    title: "Services — Digital menu & QR codes",
    description:
      "MenuOS services: digital menu, QR codes, 4 languages (EL/EN/DE/FR), call waiter, dashboard for restaurants and hotels.",
    path: "/ypiresies",
    breadcrumbLabel: "Services",
  },
  howItWorks: {
    title: "How it works — signup to live menu",
    description:
      "How to get started with MenuOS: sign up, create your menu, print QR codes for tables. Simple steps for restaurants and hotels.",
    path: "/pos-leitourgei",
    breadcrumbLabel: "How it works",
  },
  pricing: {
    title: "Pricing — Plans from €9.99/month",
    description:
      "MenuOS pricing: free 7-day trial, Basic €9.99/month, Pro €19.99/month. No hidden fees. Contact us for Enterprise.",
    path: "/pricing",
    breadcrumbLabel: "Pricing",
  },
  about: {
    title: "About — MenuOS for the Greek market",
    description:
      "MenuOS was built for restaurants and hotels in Greece that want a modern digital menu without complexity.",
    path: "/sxetika",
    breadcrumbLabel: "About",
  },
  contact: {
    title: "Contact — Support & Enterprise",
    description:
      "Contact the MenuOS team for a trial, Enterprise pricing or support. Tel. +30 210 700 0925, info@b-os.gr",
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
    a: "With a basic menu, usually in under an hour. The trial is 7 days.",
  },
  {
    q: "Does it work for hotels?",
    a: "Yes — pool bar, breakfast, room service, separate menu per area or table.",
  },
  {
    q: "How many languages are supported?",
    a: "Greek, English, German and French.",
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
    a: "4 languages on the QR menu: Greek, English, German, French — switch with one tap.",
  },
  {
    q: "Can I change prices quickly?",
    a: "Yes. Update from the dashboard and guests see the change immediately.",
  },
] as const;

export const SEO_PRICING_FAQ_EN = [
  {
    q: "Do I need a credit card for the trial?",
    a: "No. The 7-day trial starts with email and OTP verification.",
  },
  {
    q: "Can I change plan later?",
    a: "Yes. Upgrade Basic or Pro from the billing panel. Contact us for Enterprise.",
  },
  {
    q: "What does Enterprise include?",
    a: "Custom domain, white-label, multiple venues, priority support — quote per project.",
  },
  {
    q: "Is there a long-term commitment?",
    a: "No. Monthly subscription, cancel anytime.",
  },
] as const;

export const SEO_PRICING_OFFERS_EN = [
  { name: "7-day trial", price: 0, description: "1 venue, 1 menu, 50 items" },
  { name: "Basic", price: 9.99, description: "1 venue, 3 menus, unlimited items" },
  { name: "Pro", price: 19.99, description: "3 venues, unlimited menus" },
] as const;
