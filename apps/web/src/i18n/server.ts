import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_REQUEST_HEADER,
  resolveLocale,
  type Locale,
} from "./types";

export async function getServerLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(LOCALE_REQUEST_HEADER);
  if (fromHeader && isLocale(fromHeader)) return fromHeader;

  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return resolveLocale(cookie ?? DEFAULT_LOCALE);
}
