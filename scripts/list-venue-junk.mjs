#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const venues = await p.venue.findMany({ select: { id: true, slug: true, name: true } });
for (const v of venues) {
  const spots = await p.venueSpot.findMany({ where: { venueId: v.id }, select: { label: true, type: true } });
  const junkSpots = spots.filter((s) => /paralia|orofos|οροφος|αυλη/i.test(s.label));
  const calls = await p.waiterCall.findMany({
    where: { venueId: v.id, status: { in: ["PENDING", "ACKNOWLEDGED"] } },
    select: { tableNumber: true, sunbedNumber: true, roomNumber: true, type: true },
  });
  const junkCalls = calls.filter((c) =>
    /paralia|orofos|οροφος/i.test(c.tableNumber || c.sunbedNumber || c.roomNumber || ""),
  );
  if (junkSpots.length || junkCalls.length) {
    console.log(JSON.stringify({ slug: v.slug, name: v.name, junkSpots, junkCalls }, null, 2));
  }
}
await p.$disconnect();
