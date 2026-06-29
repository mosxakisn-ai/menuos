import { APP_URL } from "@/lib/config";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function mailAppBaseUrl(): string {
  const fromEnv = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (fromEnv && !fromEnv.includes("localhost")) {
    return fromEnv.replace(/\/$/, "");
  }
  return APP_URL.replace(/\/$/, "");
}

export function brandedEmailLayout(input: {
  preheader: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const baseUrl = mailAppBaseUrl();
  const logoUrl = `${baseUrl}/icon`;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563EB 0%,#06B6D4 100%);padding:28px 32px 24px;text-align:center;">
              <img src="${logoUrl}" alt="MenuOS" width="56" height="56" style="display:block;margin:0 auto 14px;border-radius:14px;background:#ffffff;padding:6px;" />
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">MenuOS</p>
              <p style="margin:8px 0 0;font-size:13px;color:#e0f2fe;">Scan. Browse. Enjoy.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 20px;">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                ${escapeHtml(input.footerNote ?? "Αν δεν ζήτησες αυτό το email, μπορείς να το αγνοήσεις με ασφάλεια.")}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:11px;color:#94a3b8;">© ${year} MenuOS · <a href="${baseUrl}" style="color:#2563EB;text-decoration:none;">menuos.gr</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWelcomeEmailHtml(input: {
  name: string;
  businessName: string;
  trialEndsAt: string;
}): string {
  const dashboardUrl = `${mailAppBaseUrl()}/dashboard`;
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Καλώς ήρθες, ${escapeHtml(input.name)}!</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
      Η επιχείρηση <strong>${escapeHtml(input.businessName)}</strong> είναι έτοιμη στο MenuOS.
      Ξεκίνα με QR menu, κατηγορίες και call waiter — χωρίς native app για τους πελάτες σου.
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
      <strong>Δωρεάν trial:</strong> έως ${escapeHtml(input.trialEndsAt)}<br />
      Μετά μπορείς να αναβαθμίσεις από το dashboard (Basic ή Pro).
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:12px;background:#2563EB;">
          <a href="${dashboardUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Άνοιγμα dashboard</a>
        </td>
      </tr>
    </table>`;

  return brandedEmailLayout({
    preheader: `Καλώς ήρθες στο MenuOS — trial έως ${input.trialEndsAt}`,
    title: "MenuOS — καλώς ήρθες",
    bodyHtml,
  });
}

export function buildWelcomeEmailText(input: {
  name: string;
  businessName: string;
  trialEndsAt: string;
}): string {
  const dashboardUrl = `${mailAppBaseUrl()}/dashboard`;
  return `Καλώς ήρθες στο MenuOS, ${input.name}!

Η επιχείρηση «${input.businessName}» δημιουργήθηκε.
Δωρεάν trial έως: ${input.trialEndsAt}

Άνοιγμα dashboard: ${dashboardUrl}

MenuOS — https://menuos.gr`;
}

export function buildSubscriptionActivatedEmailHtml(input: {
  name: string;
  businessName: string;
  planName: string;
  priceMonthly: number;
}): string {
  const billingUrl = `${mailAppBaseUrl()}/dashboard/billing`;
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Η συνδρομή σου ενεργοποιήθηκε</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
      Γεια σου ${escapeHtml(input.name)}, η επιχείρηση <strong>${escapeHtml(input.businessName)}</strong>
      είναι πλέον στο πλάνο <strong>${escapeHtml(input.planName)}</strong> (€${input.priceMonthly}/μήνα).
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
      Μπορείς να διαχειριστείς venues, menus και QR codes από το dashboard.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:12px;background:#2563EB;">
          <a href="${billingUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Billing &amp; plan</a>
        </td>
      </tr>
    </table>`;

  return brandedEmailLayout({
    preheader: `MenuOS ${input.planName} — συνδρομή ενεργή`,
    title: "MenuOS — ενεργή συνδρομή",
    bodyHtml,
    footerNote: "Λαμβάνεις αυτό το email επειδή ολοκληρώθηκε πληρωμή συνδρομής στο MenuOS.",
  });
}

export function buildSubscriptionActivatedEmailText(input: {
  name: string;
  businessName: string;
  planName: string;
  priceMonthly: number;
}): string {
  return `MenuOS — η συνδρομή σου ενεργοποιήθηκε

Γεια σου ${input.name},

Επιχείρηση: ${input.businessName}
Πλάνο: ${input.planName} (€${input.priceMonthly}/μήνα)

Dashboard: ${mailAppBaseUrl()}/dashboard

MenuOS — https://menuos.gr`;
}
