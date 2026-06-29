import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueSchema } from "@menuos/shared";
import { getSession } from "@/lib/auth";
import { canOrganizationAddVenue } from "@/lib/billing";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = venueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const venueCheck = await canOrganizationAddVenue(session.organizationId);
  if (!venueCheck.ok) {
    return NextResponse.json({ error: venueCheck.error, code: venueCheck.code }, { status: 403 });
  }

  const existing = await prisma.venue.findUnique({
    where: {
      organizationId_slug: {
        organizationId: session.organizationId,
        slug: parsed.data.slug,
      },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const venue = await prisma.venue.create({
    data: {
      organizationId: session.organizationId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      settings: { create: { brandName: parsed.data.name } },
      menus: {
        create: {
          name: "Main Menu",
          type: "RESTAURANT",
        },
      },
    },
  });

  return NextResponse.json({ venue });
}
