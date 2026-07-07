import { prisma } from "@menuos/db";
import {
  DEFAULT_ORGANIZATION_NOTIFICATION_SETTINGS,
  normalizeOrganizationNotificationSettings,
  organizationNotificationSettingsSchema,
  type OrganizationNotificationSettings,
} from "@menuos/shared";

export async function getOrganizationNotificationSettings(
  organizationId: string,
): Promise<OrganizationNotificationSettings> {
  const row = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { notificationSettings: true },
  });
  return normalizeOrganizationNotificationSettings(row?.notificationSettings ?? null);
}

export async function saveOrganizationNotificationSettings(
  organizationId: string,
  patch: Partial<OrganizationNotificationSettings>,
): Promise<OrganizationNotificationSettings> {
  const current = await getOrganizationNotificationSettings(organizationId);
  const merged = organizationNotificationSettingsSchema.parse({
    ...DEFAULT_ORGANIZATION_NOTIFICATION_SETTINGS,
    ...current,
    ...patch,
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { notificationSettings: merged },
  });

  return merged;
}
