import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueSchema } from "@menuos/shared";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = venueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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
