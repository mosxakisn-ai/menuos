import { prisma } from "@menuos/db";
import { slugify, slugifyOrFallback } from "@/lib/utils";

export function baseVenueSlug(name: string): string {
  return slugifyOrFallback(name, "venue");
}

/** Globally unique slug for public /m/{slug} URLs. */
export async function allocateGlobalVenueSlug(name: string, preferred?: string): Promise<string> {
  const base = preferred && preferred.length >= 2 ? preferred : baseVenueSlug(name);
  let candidate = base;

  for (let attempt = 0; attempt < 25; attempt++) {
    const taken = await prisma.venue.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
    candidate = `${base}-${attempt + 2}`;
  }

  return `${base}-${Date.now().toString(36).slice(-6)}`;
}
