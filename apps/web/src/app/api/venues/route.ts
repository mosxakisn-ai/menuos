import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { canOrganizationAddVenue } from "@/lib/billing";
import { allocateGlobalVenueSlug, baseVenueSlug } from "@/lib/venue-slug";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let parsed = venueSchema.safeParse(body);
  if (!parsed.success && typeof body === "object" && body && "name" in body) {
    parsed = venueSchema.safeParse({
      ...(body as Record<string, unknown>),
      slug: baseVenueSlug(String((body as { name: string }).name)),
    });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  return createVenue(auth.session!.organizationId, parsed.data);
}

async function createVenue(
  organizationId: string,
  data: { name: string; slug: string; description?: string },
) {
  const venueCheck = await canOrganizationAddVenue(organizationId);
  if (!venueCheck.ok) {
    return NextResponse.json({ error: venueCheck.error, code: venueCheck.code }, { status: 403 });
  }

  const slug = await allocateGlobalVenueSlug(data.name, data.slug);

  try {
    const venue = await prisma.venue.create({
      data: {
        organizationId,
        name: data.name,
        slug,
        description: data.description,
        settings: { create: { brandName: data.name } },
        menus: {
          create: {
            name: "Main Menu",
            type: "RESTAURANT",
          },
        },
      },
    });

    return NextResponse.json({ venue });
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code: string }).code : null;
    if (code === "P2002") {
      return NextResponse.json({ error: "Slug already taken. Try a different name." }, { status: 409 });
    }
    throw err;
  }
}
