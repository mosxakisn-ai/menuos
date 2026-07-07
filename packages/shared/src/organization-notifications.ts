import { z } from "zod";

export const organizationNotificationSettingsSchema = z.object({
  customerOrdersEnabled: z.boolean(),
  waiterCallEnabled: z.boolean(),
  voiceMessagesEnabled: z.boolean(),
});

export type OrganizationNotificationSettings = z.infer<typeof organizationNotificationSettingsSchema>;

export const DEFAULT_ORGANIZATION_NOTIFICATION_SETTINGS: OrganizationNotificationSettings = {
  customerOrdersEnabled: true,
  waiterCallEnabled: true,
  voiceMessagesEnabled: true,
};

export function normalizeOrganizationNotificationSettings(
  raw: unknown,
): OrganizationNotificationSettings {
  const parsed = organizationNotificationSettingsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { ...DEFAULT_ORGANIZATION_NOTIFICATION_SETTINGS };
}
