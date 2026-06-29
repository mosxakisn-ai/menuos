import { APP_NAME as SHARED_APP_NAME, APP_URL as SHARED_APP_URL } from "@menuos/shared";

export const APP_NAME = SHARED_APP_NAME;
export const APP_URL = (
  process.env.APP_URL ??
  process.env.NEXTAUTH_URL ??
  SHARED_APP_URL
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Premium QR menu platform for restaurants, hotels, and hospitality. Digital menus in minutes — multi-language, call waiter, no app required.";

export const SITE_DESCRIPTION_EL =
  "Premium πλατφόρμα QR menu για εστιατόρια, ξενοδοχεία και hospitality. Ψηφιακά menus σε λεπτά — πολυγλωσσικά, call waiter, χωρίς app.";

export const APP_TAGLINE = "Scan. Browse. Enjoy.";

export const SESSION_COOKIE = "menuos_session";
