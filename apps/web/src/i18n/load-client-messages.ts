import type { Locale } from "./types";
import type { MenuOsMessages } from "./get-messages";

export async function loadClientMessages(locale: Locale): Promise<MenuOsMessages> {
  if (locale === "en") {
    const { getMessages } = await import("./get-messages");
    return await getMessages("en");
  }
  const { getMessages } = await import("./get-messages");
  return await getMessages("el");
}
