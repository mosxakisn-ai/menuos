import { prisma } from "@menuos/db";
import { getPlan } from "@menuos/shared";
import {
  buildAdminNotificationEmailHtml,
  buildAdminNotificationEmailText,
  type AdminNotifyField,
} from "@/lib/admin-notify-templates";
import { createMailTransporter, isMailConfigured, mailFromAddress } from "@/lib/mail-transport";

export function adminNotifyRecipients(): string[] {
  const raw = process.env.MENUOS_NOTIFY_EMAIL ?? "info@b-os.gr";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function display(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function athensNow(): string {
  return new Intl.DateTimeFormat("el-GR", {
    timeZone: "Europe/Athens",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());
}

async function sendAdminNotification(subject: string, eventLabel: string, fields: AdminNotifyField[]) {
  const recipients = adminNotifyRecipients();
  if (recipients.length === 0) return;

  const withTimestamp: AdminNotifyField[] = [
    { label: "Ημερομηνία / ώρα", value: athensNow() },
    ...fields,
  ];

  const text = buildAdminNotificationEmailText(eventLabel, withTimestamp);
  const html = buildAdminNotificationEmailHtml(eventLabel, withTimestamp);

  if (!isMailConfigured()) {
    console.log(`[menuos-admin-notify] ${subject}`);
    for (const f of withTimestamp) console.log(`  ${f.label}: ${f.value}`);
    return;
  }

  const transporter = createMailTransporter();
  await transporter.sendMail({
    from: mailFromAddress(),
    to: recipients.join(", "),
    subject,
    text,
    html,
  });
}

export function fireAdminNotify(task: () => Promise<void>) {
  void task().catch((err) => console.error("[menuos-admin-notify]", err));
}

export async function notifyAdminOrganizationRegistered(input: {
  organizationId: string;
  businessName: string;
  ownerName: string;
  email: string;
  orgSlug: string;
}) {
  await sendAdminNotification(
    `MenuOS — νέα εγγραφή: ${input.businessName}`,
    "Νέα εγγραφή πελάτη",
    [
      { label: "Προϊόν", value: "MenuOS" },
      { label: "ID οργανισμού", value: input.organizationId },
      { label: "Επιχείρηση", value: input.businessName },
      { label: "Slug", value: input.orgSlug },
      { label: "Υπεύθυνος", value: input.ownerName },
      { label: "Email", value: input.email },
      { label: "Πλάνο", value: "Trial (7 ημέρες)" },
    ],
  );
}

export async function notifyAdminStripePayment(input: {
  paymentType: "subscription";
  amountEur: number;
  organizationId?: string;
  customerEmail?: string;
  sessionId?: string;
  planId?: string;
}) {
  let orgFields: AdminNotifyField[] = [];
  if (input.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: input.organizationId },
      include: { users: { where: { role: "ADMIN" }, take: 1 } },
    });
    if (org) {
      orgFields = [
        { label: "Επιχείρηση", value: org.name },
        { label: "ID οργανισμού", value: org.id },
        { label: "Email admin", value: org.users[0]?.email ?? "—" },
      ];
    }
  }

  const fields: AdminNotifyField[] = [
    { label: "Προϊόν", value: "MenuOS" },
    { label: "Τύπος", value: "Πληρωμή συνδρομής" },
    { label: "Ποσό", value: `€${input.amountEur}` },
    { label: "Stripe session", value: display(input.sessionId) },
    ...orgFields,
  ];

  if (input.customerEmail) {
    fields.push({ label: "Email πληρωμής (Stripe)", value: input.customerEmail });
  }

  if (input.planId) {
    const plan = getPlan(input.planId);
    fields.push({ label: "Πλάνο", value: plan.name });
  }

  const label = orgFields.find((f) => f.label === "Επιχείρηση")?.value ?? input.customerEmail ?? "subscription";

  await sendAdminNotification(
    `MenuOS — πληρωμή: ${label} (€${input.amountEur})`,
    "Νέα πληρωμή συνδρομής",
    fields,
  );
}
