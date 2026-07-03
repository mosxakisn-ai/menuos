import { APP_NAME as SHARED_APP_NAME, APP_URL as SHARED_APP_URL } from "@menuos/shared";
import { SEO_SITE } from "@/content/seo-el";

export const APP_NAME = SHARED_APP_NAME;
export const APP_URL = (
  process.env.APP_URL ??
  process.env.NEXTAUTH_URL ??
  SHARED_APP_URL
).replace(/\/$/, "");

export const SITE_DESCRIPTION = SEO_SITE.description;
export const SITE_DESCRIPTION_EL = SEO_SITE.description;

export const APP_TAGLINE = "Scan. Browse. Order. 360°.";

export const SESSION_COOKIE = "menuos_session";
