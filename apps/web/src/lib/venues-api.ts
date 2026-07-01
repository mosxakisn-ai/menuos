import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueSchema, venueUpdateSchema } from "@menuos/shared";
import { canOrganizationAddVenue } from "@/lib/billing";
import {
  assertCanAddVenueInTransaction,
  planLimitErrorResponse,
  serializableTransaction,
} from "@/lib/plan-limits";
import { allocateGlobalVenueSlug, baseVenueSlug } from "@/lib/venue-slug";

export async function createVenueHandler(request: Request, organizationId: string) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  let parsed = venueSchema.safeParse(body);
  if (!parsed.success && typeof body === "object" && body && "name" in body) {
    parsed = venueSchema.safeParse({
      ...(body as Record<string, unknown>),
      slug: baseVenueSlug(String((body as { name: string }).name)),
    });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const venueCheck = await canOrganizationAddVenue(organizationId);
  if (!venueCheck.ok) {
    return NextResponse.json({ error: venueCheck.error, code: venueCheck.code }, { status: 403 });
  }

  const slug = await allocateGlobalVenueSlug(parsed.data.name, parsed.data.slug);

  try {
    const venue = await prisma.$transaction(async (tx) => {
      await assertCanAddVenueInTransaction(tx, organizationId);
      return tx.venue.create({
        data: {
          organizationId,
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          settings: { create: { brandName: parsed.data.name } },
          menus: {
            create: {
              name: "Κύριος κατάλογος",
              type: "RESTAURANT",
            },
          },
        },
        include: { menus: true },
      });
    }, serializableTransaction);

    return NextResponse.json({ venue, message: "Το κατάστημα δημιουργήθηκε! Πρόσθεσε τώρα κατηγορίες και πιάτα." });
  } catch (err) {
    const limit = planLimitErrorResponse(err);
    if (limit) {
      return NextResponse.json({ code: limit.code }, { status: limit.status });
    }
    const code = typeof err === "object" && err && "code" in err ? (err as { code: string }).code : null;
    if (code === "P2002") {
      return NextResponse.json({ error: "Το slug υπάρχει ήδη. Δοκίμασε άλλο όνομα." }, { status: 409 });
    }
    throw err;
  }
}
