import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@menuos/db";
import { listVenuePosts } from "@menuos/shared";
import { requireLive360Plan } from "@/lib/api-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import {
  loadStaffScreensByStation,
  resolveStaffMemberAccessLink,
} from "@/lib/staff-member-access-url";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string; memberId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, memberId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const member = await prisma.venueStaffMember.findFirst({
    where: { id: memberId, venueId },
    select: {
      id: true,
      memberToken: true,
      zoneId: true,
      stations: true,
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Το μέλος δεν βρέθηκε." }, { status: 404 });
  }

  const opsConfig = await getVenueOperationsConfig(venueId);
  const posts = listVenuePosts(opsConfig ?? undefined, "GR");
  const screensByStation = await loadStaffScreensByStation(venueId);
  const access = resolveStaffMemberAccessLink({
    venueSlug: venue.slug,
    memberToken: member.memberToken,
    zoneId: member.zoneId,
    stations: member.stations,
    posts,
    screensByStation,
  });

  if (access.kind === "invalid-assignment") {
    return NextResponse.json({ error: "Χωρίς έγκυρο πόστο — διάλεξε ξανά πόστο και χώρο." }, { status: 400 });
  }
  if (access.kind === "missing-screen") {
    return NextResponse.json(
      { error: "Δεν υπάρχει link tablet — αποθήκευσε τα πόστα στο tab «Πόστα»." },
      { status: 409 },
    );
  }

  const pngDataUrl = await QRCode.toDataURL(access.url, {
    width: 512,
    margin: 2,
    color: { dark: venue.primaryColor ?? "#2563EB", light: "#FFFFFF" },
  });

  return NextResponse.json({
    accessUrl: access.url,
    pngDataUrl,
    device: access.device,
  });
}
