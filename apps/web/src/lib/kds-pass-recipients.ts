import { prisma } from "@menuos/db";
import {
  applyZoneLabelOverrides,
  groupVenueSpotsByZone,
  listVenuePosts,
  migrateStaffStationsFromLegacy,
  normalizeLegacyStaffStations,
  normalizeStaffMemberZoneId,
  staffAssignmentLabelForLang,
  staffJobRoleForAssignment,
  staffJobRoleLabel,
  staffMemberEligibleForKdsPassNotify,
  staffMemberEffectiveZoneId,
  staffPostRequiresZoneAssignment,
  staffPrimaryAssignment,
  type PassStationInput,
} from "@menuos/shared";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";

export type KdsPassRecipientRow = {
  id: string;
  name: string;
  roleLabel: string;
  zoneLabel: string;
  postLabel: string;
};

function zoneLabelForMember(
  zoneId: string | null,
  zoneLabels: Record<string, string> | undefined,
  groups: ReturnType<typeof groupVenueSpotsByZone>,
): string {
  if (!zoneId || zoneId === "all") return "Όλοι οι χώροι";
  const group = groups.find((row) => row.id === zoneId);
  if (group) return group.label;
  const override = zoneLabels?.[zoneId]?.trim();
  if (override) return override;
  if (zoneId === "main") return "Σάλα";
  return zoneId;
}

export async function listKdsPassNotifyRecipients(input: {
  venueId: string;
  passStation: PassStationInput;
  targetZoneId: string | null | undefined;
  lang?: "GR" | "EN";
}): Promise<{ recipients: KdsPassRecipientRow[]; zoneLabel: string | null }> {
  const lang = input.lang ?? "GR";
  const opsConfig = await getVenueOperationsConfig(input.venueId);
  const posts = listVenuePosts(opsConfig);

  const spots = await prisma.venueSpot.findMany({
    where: { venueId: input.venueId },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    select: { type: true, label: true },
    take: 200,
  });
  const zoneGroups = applyZoneLabelOverrides(groupVenueSpotsByZone(spots), opsConfig.zoneLabels);
  const zoneLabel = input.targetZoneId
    ? zoneLabelForMember(input.targetZoneId, opsConfig.zoneLabels, zoneGroups)
    : null;

  const membersRaw = await prisma.venueStaffMember.findMany({
    where: { venueId: input.venueId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, roleLabel: true, stations: true, zoneId: true },
  });

  const recipients: KdsPassRecipientRow[] = [];
  for (const member of membersRaw) {
    const stations = migrateStaffStationsFromLegacy(normalizeLegacyStaffStations(member.stations), posts);
    const primary = staffPrimaryAssignment(stations);
    let zoneId = normalizeStaffMemberZoneId(primary, member.zoneId, posts);
    if (staffPostRequiresZoneAssignment(primary, posts) && !zoneId) zoneId = "all";
    const normalized = { ...member, stations, zoneId };
    const effectiveZoneId = staffMemberEffectiveZoneId(normalized, posts);

    if (
      !staffMemberEligibleForKdsPassNotify(normalized, {
        targetZoneId: input.targetZoneId,
      }, posts)
    ) {
      continue;
    }

    const memberRole = staffJobRoleForAssignment(primary, posts);
    recipients.push({
      id: member.id,
      name: member.name,
      roleLabel:
        member.roleLabel?.trim() ||
        (memberRole !== "invalid" ? staffJobRoleLabel(memberRole, lang) : "—"),
      zoneLabel: zoneLabelForMember(effectiveZoneId, opsConfig.zoneLabels, zoneGroups),
      postLabel: staffAssignmentLabelForLang(primary, lang, posts),
    });
  }

  return { recipients, zoneLabel };
}

export async function validateKdsPassNotifyTargets(input: {
  venueId: string;
  targetZoneId: string | null | undefined;
  notifyStaffMemberIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.notifyStaffMemberIds.length === 0) {
    return { ok: false, error: "Διάλεξε τουλάχιστον έναν παραλήπτη." };
  }
  const { recipients } = await listKdsPassNotifyRecipients({
    venueId: input.venueId,
    passStation: "kitchen",
    targetZoneId: input.targetZoneId,
  });
  const allowed = new Set(recipients.map((row) => row.id));
  const invalid = input.notifyStaffMemberIds.filter((id) => !allowed.has(id));
  if (invalid.length > 0) {
    return { ok: false, error: "Μη έγκυροι παραλήπτες για αυτόν τον χώρο." };
  }
  return { ok: true };
}
