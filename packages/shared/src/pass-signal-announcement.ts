import {
  resolveWaiterLocationInZone,
  resolveWaiterLocationInZones,
  type SpotZoneGroup,
} from "./station-spot-zones";
import { formatWaiterCallLocationForLang, type WaiterCallLocation } from "./venue-spots";

const MAIN_ZONE_ID = "main";
export const PASS_ALERT_SUFFIX = "έχετε νέο μήνυμα";

export type PassAnnouncementLocation = WaiterCallLocation;

export type PassAnnouncementOptions = {
  zoneGroups?: SpotZoneGroup[];
  activeZoneId?: string | null;
};

function normalizeZoneKey(label: string): string {
  return label
    .trim()
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Natural Greek preposition + zone name for TTS (e.g. «στον κήπο»). */
export function zoneLocationPhrase(zoneLabel: string): string {
  const raw = zoneLabel.trim();
  const key = normalizeZoneKey(raw);

  const known: Record<string, string> = {
    κηπο: "στον κήπο",
    αυλη: "στην αυλή",
    σαλα: "στη σάλα",
    σαλονι: "στο σαλόνι",
    οροφος: "στον όροφο",
    μπαρ: "στο μπαρ",
    pool: "στην πισίνα",
    πισινα: "στην πισίνα",
    beach: "στην παραλία",
    παραλια: "στην παραλία",
  };
  if (known[key]) return known[key]!;

  const lower = raw.toLocaleLowerCase("el-GR");
  if (/(ος|ας|ης)$/u.test(key)) return `στον ${lower}`;
  if (/(α|η)$/u.test(key)) return `στην ${lower}`;
  if (/(ο|ι)$/u.test(key)) return `στο ${lower}`;
  return `στον χώρο ${lower}`;
}

function tableAnnouncement(tableNum: string, zoneLabel?: string | null): string {
  const tablePart = `στο τραπέζι ${tableNum}`;
  if (zoneLabel?.trim()) {
    return `${zoneLocationPhrase(zoneLabel)} ${tablePart} ${PASS_ALERT_SUFFIX}`;
  }
  return `${tablePart} ${PASS_ALERT_SUFFIX}`;
}

/** Greek TTS/push line — space + table + «έχετε νέο μήνυμα» (no message body). */
export function buildPassSignalAnnouncement(
  location: PassAnnouncementLocation,
  options?: PassAnnouncementOptions,
): string {
  const groups = options?.zoneGroups ?? [];
  const resolved = groups.length
    ? options?.activeZoneId?.trim()
      ? resolveWaiterLocationInZone(location, options.activeZoneId, groups)
      : resolveWaiterLocationInZones(location, groups)
    : null;

  if (resolved && groups.length) {
    const group = groups.find((row) => row.id === resolved.zoneId);
    const entry = group?.spots.find(
      (row) => row.spot.type === resolved.spot.type && row.spot.label === resolved.spot.label,
    );

    if (resolved.spot.type === "TABLE") {
      const tableNum = entry?.displayLabel ?? resolved.spot.label;
      const zoneLabel = group && resolved.zoneId !== MAIN_ZONE_ID ? group.label : null;
      return tableAnnouncement(tableNum, zoneLabel);
    }

    if (resolved.spot.type === "ROOM") {
      return `στο δωμάτιο ${resolved.spot.label} ${PASS_ALERT_SUFFIX}`;
    }

    if (resolved.spot.type === "SUNBED") {
      return `στη ξαπλώστρα ${resolved.spot.label} ${PASS_ALERT_SUFFIX}`;
    }
  }

  const loc = formatWaiterCallLocationForLang(location, "GR");
  if (loc === "Χωρίς θέση") return PASS_ALERT_SUFFIX;
  const lower = loc.toLowerCase();
  if (lower.startsWith("τραπέζι ")) {
    return tableAnnouncement(lower.slice("τραπέζι ".length));
  }
  if (lower.startsWith("δωμάτιο ")) {
    return `στο ${lower} ${PASS_ALERT_SUFFIX}`;
  }
  if (lower.startsWith("ξαπλώστρα ")) {
    return `στη ${lower} ${PASS_ALERT_SUFFIX}`;
  }
  return `${lower} ${PASS_ALERT_SUFFIX}`;
}

/** Push notification title + body (Greek). */
export function buildPassSignalPushCopy(
  location: PassAnnouncementLocation,
  options?: PassAnnouncementOptions,
): { title: string; body: string } {
  const line = buildPassSignalAnnouncement(location, options);
  const body = line.replace(new RegExp(`\\s*${PASS_ALERT_SUFFIX}$`), "").trim();
  return {
    title: "Νέο μήνυμα",
    body: body || "—",
  };
}
