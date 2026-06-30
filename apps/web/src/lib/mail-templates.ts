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

function formatEuro(amount: number): string {
  return amount.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function emailSupportLine(): string {
  const base = mailAppBaseUrl();
  return `Επικοινωνία: <a href="${base}/epikoinonia" style="color:#2563EB;text-decoration:none;">menuos.gr/epikoinonia</a>`;
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
              <p style="margin:8px 0 0;font-size:13px;color:#e0f2fe;">Σκάναρε. Δες. Απόλαυσε.</p>
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
              <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
                ${emailSupportLine()}
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
  trialDays?: number;
}): string {
  const dashboardUrl = `${mailAppBaseUrl()}/dashboard?welcome=1`;
  const venueUrl = `${mailAppBaseUrl()}/dashboard/venues/new`;
  const trialDays = input.trialDays ?? 7;
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Καλώς ήρθες, ${escapeHtml(input.name)}!</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
      Η επιχείρηση <strong>${escapeHtml(input.businessName)}</strong> είναι έτοιμη στο MenuOS.
      Έχεις <strong>${trialDays} ημέρες δωρεάν δοκιμή</strong> (έως ${escapeHtml(input.trialEndsAt)}) — χωρίς κάρτα.
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">
      Στη δοκιμή: 1 κατάστημα · 1 κατάλογος · έως 50 πιάτα.
    </p>
    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">Τα 3 βήματα για να βγεις live:</p>
    <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.75;color:#475569;">
      <li><strong>Φτιάξε το κατάστημά σου</strong> — όνομα, χρώματα, λογότυπο</li>
      <li><strong>Βάλε πιάτα</strong> — κατηγορίες, τιμές, φωτογραφίες</li>
      <li><strong>Βγάλε QR</strong> — τύπωσέ τα και βάλτα στα τραπέζια</li>
    </ol>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
      <tr>
        <td style="border-radius:12px;background:#2563EB;">
          <a href="${dashboardUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Άνοιγμα panel</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
      Δεν έχεις ακόμα κατάστημα; <a href="${venueUrl}" style="color:#2563EB;text-decoration:none;font-weight:600;">Ξεκίνα εδώ</a>
    </p>`;

  return brandedEmailLayout({
    preheader: `Ξεκίνα τη δοκιμή σου — ${trialDays} ημέρες, έως ${input.trialEndsAt}`,
    title: "MenuOS — καλώς ήρθες",
    bodyHtml,
    footerNote: "Θα σου στείλουμε υπενθύμιση πριν λήξει η δοκιμή. Μπορείς να αναβαθμιστείς Basic ή Pro όποτε θες.",
  });
}

export function buildWelcomeEmailText(input: {
  name: string;
  businessName: string;
  trialEndsAt: string;
  trialDays?: number;
}): string {
  const dashboardUrl = `${mailAppBaseUrl()}/dashboard?welcome=1`;
  const venueUrl = `${mailAppBaseUrl()}/dashboard/venues/new`;
  const trialDays = input.trialDays ?? 7;
  return `Καλώς ήρθες στο MenuOS, ${input.name}!

Η επιχείρηση «${input.businessName}» δημιουργήθηκε.
Δωρεάν δοκιμή ${trialDays} ημερών — έως ${input.trialEndsAt} (χωρίς κάρτα).
Στη δοκιμή: 1 κατάστημα, 1 κατάλογος, έως 50 πιάτα.

Τα 3 βήματα:
1. Φτιάξε το κατάστημά σου
2. Βάλε πιάτα στον κατάλογο
3. Βγάλε QR για τα τραπέζια

Άνοιγμα panel: ${dashboardUrl}
Νέο κατάστημα: ${venueUrl}

MenuOS — ${mailAppBaseUrl()}`;
}

function trialEmailStepsHtml(): string {
  const base = mailAppBaseUrl();
  return `
    <ol style="margin:16px 0 0;padding-left:20px;font-size:14px;line-height:1.75;color:#475569;">
      <li><a href="${base}/dashboard/venues/new" style="color:#2563EB;text-decoration:none;font-weight:600;">Κατάστημα</a> — αν δεν το έχεις φτιάξει</li>
      <li><a href="${base}/dashboard/menus" style="color:#2563EB;text-decoration:none;font-weight:600;">Κατάλογος</a> — κατηγορίες &amp; πιάτα</li>
      <li><a href="${base}/dashboard/qr" style="color:#2563EB;text-decoration:none;font-weight:600;">QR codes</a> — λήψη &amp; εκτύπωση</li>
    </ol>`;
}

export function buildTrialMidReminderEmailHtml(input: {
  name: string;
  businessName: string;
  trialEndsAt: string;
  daysLeft: number;
}): string {
  const billingUrl = `${mailAppBaseUrl()}/dashboard/billing`;
  const dashboardUrl = `${mailAppBaseUrl()}/dashboard`;
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Πώς πάει η δοκιμή σου;</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#475569;">
      Γεια σου ${escapeHtml(input.name)}, για την <strong>${escapeHtml(input.businessName)}</strong>
      απομένουν <strong>${input.daysLeft} ${input.daysLeft === 1 ? "μέρα" : "μέρες"}</strong> δωρεάν δοκιμής (έως ${escapeHtml(input.trialEndsAt)}).
    </p>
    <p style="margin:0;font-size:14px;line-height:1.65;color:#475569;">
      Αν δεν έχεις ολοκληρώσει τον κατάλογο, ακολούθησε τα βήματα:
    </p>
    ${trialEmailStepsHtml()}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;">
      <tr>
        <td style="border-radius:12px;background:#2563EB;">
          <a href="${dashboardUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Συνέχεια στο panel</a>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
      Ήδη έτοιμος; <a href="${billingUrl}" style="color:#2563EB;text-decoration:none;font-weight:600;">Δες τα πλάνα Basic &amp; Pro</a> — χωρίς δέσμευση.
    </p>`;

  return brandedEmailLayout({
    preheader: `${input.daysLeft} μέρες απομένουν — ολοκλήρωσε τον κατάλογο σου`,
    title: "MenuOS — δοκιμή σε εξέλιξη",
    bodyHtml,
    footerNote: "Λαμβάνεις υπενθύμιση για τη δωρεάν δοκιμή σου στο MenuOS.",
  });
}

export function buildTrialMidReminderEmailText(input: {
  name: string;
  businessName: string;
  trialEndsAt: string;
  daysLeft: number;
}): string {
  const base = mailAppBaseUrl();
  return `MenuOS — δοκιμή σε εξέλιξη

Γεια σου ${input.name},

Για την «${input.businessName}» απομένουν ${input.daysLeft} μέρες δωρεάν δοκιμής (έως ${input.trialEndsAt}).

Ολοκλήρωσε: κατάστημα → κατάλογος → QR codes
Panel: ${base}/dashboard
Πλάνα: ${base}/dashboard/billing`;
}

export function buildTrialEndingReminderEmailHtml(input: {
  name: string;
  businessName: string;
  trialEndsAt: string;
}): string {
  const billingUrl = `${mailAppBaseUrl()}/dashboard/billing`;
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Η δοκιμή σου λήγει σύντομα</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
      ${escapeHtml(input.name)}, η δωρεάν δοκιμή για <strong>${escapeHtml(input.businessName)}</strong>
      λήγει <strong>${escapeHtml(input.trialEndsAt)}</strong>.
      Μετά, οι πελάτες σου δεν θα βλέπουν τον QR κατάλογο εκτός αν επιλέξεις πλάνο.
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#475569;">
      Basic από €9,99/μήνα ή Pro με εισαγωγή PDF — ακύρωση οποτεδήποτε.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:12px;background:#2563EB;">
          <a href="${billingUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Διάλεξε πλάνο</a>
        </td>
      </tr>
    </table>`;

  return brandedEmailLayout({
    preheader: `Λήγει ${input.trialEndsAt} — κράτησε τον κατάλογο online`,
    title: "MenuOS — λήξη δοκιμής",
    bodyHtml,
    footerNote: "Λαμβάνεις υπενθύμιση πριν τη λήξη της δωρεάν δοκιμής σου.",
  });
}

export function buildTrialEndingReminderEmailText(input: {
  name: string;
  businessName: string;
  trialEndsAt: string;
}): string {
  const billingUrl = `${mailAppBaseUrl()}/dashboard/billing`;
  return `MenuOS — η δοκιμή σου λήγει ${input.trialEndsAt}

Γεια σου ${input.name},

Η δωρεάν δοκιμή για «${input.businessName}» λήγει ${input.trialEndsAt}.
Μετά τη λήξη, το panel κλειδώνει και οι πελάτες δεν βλέπουν τον κατάλογο.

Διάλεξε πλάνο: ${billingUrl}`;
}

export function buildTrialExpiredEmailHtml(input: {
  name: string;
  businessName: string;
}): string {
  const billingUrl = `${mailAppBaseUrl()}/dashboard/billing`;
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Η δωρεάν δοκιμή έληξε</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
      ${escapeHtml(input.name)}, η δοκιμή για <strong>${escapeHtml(input.businessName)}</strong> ολοκληρώθηκε.
      Ο κατάλογός σου είναι αποθηκευμένος — διάλεξε πλάνο για να τον ξαναβάλεις online.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:12px;background:#2563EB;">
          <a href="${billingUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Ενεργοποίηση συνδρομής</a>
        </td>
      </tr>
    </table>`;

  return brandedEmailLayout({
    preheader: "Η δοκιμή έληξε — ενεργοποίησε συνδρομή για να συνεχίσεις",
    title: "MenuOS — δοκιμή έληξε",
    bodyHtml,
    footerNote: "Λαμβάνεις αυτό το email επειδή έληξε η δωρεάν δοκιμή σου.",
  });
}

export function buildTrialExpiredEmailText(input: {
  name: string;
  businessName: string;
}): string {
  const billingUrl = `${mailAppBaseUrl()}/dashboard/billing`;
  return `MenuOS — η δωρεάν δοκιμή έληξε

Γεια σου ${input.name},

Η δοκιμή για «${input.businessName}» έληξε. Ο κατάλογός σου είναι αποθηκευμένος.
Basic από €9,99/μήνα · Pro €19,99/μήνα

Ενεργοποίηση: ${billingUrl}`;
}

export function buildSubscriptionActivatedEmailHtml(input: {
  name: string;
  businessName: string;
  planName: string;
  priceMonthly: number;
  renewalDate?: string | null;
}): string {
  const billingUrl = `${mailAppBaseUrl()}/dashboard/billing`;
  const dashboardUrl = `${mailAppBaseUrl()}/dashboard`;
  const price = formatEuro(input.priceMonthly);
  const renewalLine = input.renewalDate
    ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">Επόμενη ανανέωση: <strong>${escapeHtml(input.renewalDate)}</strong></p>`
    : "";
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Η συνδρομή σου ενεργοποιήθηκε</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
      Γεια σου ${escapeHtml(input.name)}, η επιχείρηση <strong>${escapeHtml(input.businessName)}</strong>
      είναι πλέον στο πλάνο <strong>${escapeHtml(input.planName)}</strong> (€${price}/μήνα).
    </p>
    ${renewalLine}
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
      Μπορείς να διαχειριστείς καταστήματα, καταλόγους και QR codes από το panel.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:12px;background:#2563EB;">
          <a href="${dashboardUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;margin-right:8px;">Άνοιγμα panel</a>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
      <a href="${billingUrl}" style="color:#2563EB;text-decoration:none;font-weight:600;">Δες τη συνδρομή σου</a>
    </p>`;

  return brandedEmailLayout({
    preheader: `Πλάνο ${input.planName} ενεργό — ευχαριστούμε`,
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
  renewalDate?: string | null;
}): string {
  const price = formatEuro(input.priceMonthly);
  const renewal = input.renewalDate ? `\nΕπόμενη ανανέωση: ${input.renewalDate}` : "";
  return `MenuOS — η συνδρομή σου ενεργοποιήθηκε

Γεια σου ${input.name},

Επιχείρηση: ${input.businessName}
Πλάνο: ${input.planName} (€${price}/μήνα)${renewal}

Panel: ${mailAppBaseUrl()}/dashboard
Συνδρομή: ${mailAppBaseUrl()}/dashboard/billing

MenuOS — ${mailAppBaseUrl()}`;
}

export function buildRegistrationOtpEmailHtml(input: { code: string; ttlMinutes?: number }): string {
  const ttl = input.ttlMinutes ?? 30;
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Κωδικός επιβεβαίωσης</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
      Χρησιμοποίησε τον παρακάτω κωδικό για να ολοκληρώσεις την εγγραφή σου στο MenuOS.
      Ισχύει για <strong>${ttl} λεπτά</strong> — μετά μπορείς να ζητήσεις νέο κωδικό.
    </p>
    <p style="margin:0 0 8px;font-size:32px;font-weight:800;letter-spacing:0.35em;color:#2563EB;text-align:center;">${escapeHtml(input.code)}</p>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">
      Μην μοιράζεσαι αυτόν τον κωδικό με κανέναν.
    </p>`;

  return brandedEmailLayout({
    preheader: "Ο κωδικός επιβεβαίωσης για την εγγραφή σου στο MenuOS",
    title: "MenuOS — κωδικός εγγραφής",
    bodyHtml,
    footerNote: "Αν δεν ζήτησες εγγραφή στο MenuOS, αγνόησε αυτό το email.",
  });
}

export function buildRegistrationOtpEmailText(input: { code: string; ttlMinutes?: number }): string {
  const ttl = input.ttlMinutes ?? 30;
  const registerUrl = `${mailAppBaseUrl()}/register`;
  return `MenuOS — κωδικός επιβεβαίωσης εγγραφής

Ο κωδικός σου: ${input.code}

Ισχύει για ${ttl} λεπτά. Μετά τη λήξη μπορείς να ζητήσεις νέο κωδικό.

Συνέχεια εγγραφής: ${registerUrl}

Μην τον μοιράζεσαι με κανέναν.

Αν δεν ζήτησες εγγραφή, αγνόησε αυτό το email.

MenuOS — ${mailAppBaseUrl()}`;
}
