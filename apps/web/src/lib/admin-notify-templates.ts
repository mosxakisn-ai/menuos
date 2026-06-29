import { brandedEmailLayout, escapeHtml } from "@/lib/mail-templates";

export type AdminNotifyField = { label: string; value: string };

function fieldsTable(fields: AdminNotifyField[]): string {
  const rows = fields
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;width:38%;">${escapeHtml(f.label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;vertical-align:top;">${escapeHtml(f.value)}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">${rows}</table>`;
}

export function buildAdminNotificationEmailHtml(eventLabel: string, fields: AdminNotifyField[]): string {
  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#2563EB;">Ειδοποίηση MenuOS</p>
    <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f172a;">${escapeHtml(eventLabel)}</p>
    ${fieldsTable(fields)}`;

  return brandedEmailLayout({
    preheader: `${eventLabel} — MenuOS admin`,
    title: `MenuOS — ${eventLabel}`,
    bodyHtml,
    footerNote: "Αυτόματη ειδοποίηση για την ομάδα B-OS (info@b-os.gr).",
  });
}

export function buildAdminNotificationEmailText(eventLabel: string, fields: AdminNotifyField[]): string {
  const lines = fields.map((f) => `${f.label}: ${f.value}`).join("\n");
  return `MenuOS — ${eventLabel}\n\n${lines}\n\n— Αυτόματη ειδοποίηση`;
}
