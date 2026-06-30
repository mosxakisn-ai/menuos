import type { SupervisorOrganizationRow } from "@/lib/supervisor-service";

function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadSupervisorOrganizationsCsv(
  rows: SupervisorOrganizationRow[],
  filename = "menuos-organizations.csv",
): void {
  const headers = [
    "name",
    "slug",
    "admin_email",
    "admin_name",
    "plan",
    "status",
    "trial_ends_at",
    "period_end",
    "stripe_customer_id",
    "stripe_subscription_id",
    "venues",
    "items",
    "is_demo",
    "created_at",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.name,
        row.slug,
        row.adminEmail,
        row.adminName,
        row.plan,
        row.status,
        row.trialEndsAt ?? "",
        row.currentPeriodEnd ?? "",
        row.stripeCustomerId ?? "",
        row.stripeSubId ?? "",
        row.venueCount,
        row.itemCount,
        row.isDemo ? "yes" : "no",
        row.createdAt,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
