import type { Locale } from "./types";
import type { MenuOsMessages } from "./get-messages";

/** Browser locale switch — static bundles only (no Prisma on client). */
export async function loadClientMessages(locale: Locale): Promise<MenuOsMessages> {
  const { getStaticMessages } = await import("./get-messages");
  return getStaticMessages(locale);
}
