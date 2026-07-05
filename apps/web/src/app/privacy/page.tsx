import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { MarketingLayout, MarketingLegalDocument } from "@/components/marketing/marketing-layout";
import { SEO_SITE } from "@/content/seo-el";
import { generateMarketingMetadata } from "@/lib/seo";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";

export async function generateMetadata() {
  return generateMarketingMetadata("privacy");
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const { marketing } = await getMessages(locale);
  const isEn = locale === "en";
  const badge = marketing.footer.columns.legal;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="privacy" />
      <MarketingLegalDocument
        title={isEn ? "Privacy policy" : "Πολιτική απορρήτου"}
        updated={isEn ? "Last updated: June 2026" : "Τελευταία ενημέρωση: Ιούνιος 2026"}
        badge={badge}
      >
        {isEn ? (
          <>
            <h2>1. Who we are</h2>
            <p>
              MenuOS (menuos.gr) is an online digital menu platform. The data controller for business accounts is
              the team operating MenuOS. Contact:{" "}
              <a href={`tel:${SEO_SITE.contactPhoneTel}`}>{SEO_SITE.contactPhone}</a>,{" "}
              <a href={`mailto:${SEO_SITE.contactEmail}`}>{SEO_SITE.contactEmail}</a>.
            </p>

            <h2>2. What data we collect</h2>
            <p>For registered businesses:</p>
            <ul>
              <li>Account details (name, email, password in encrypted form)</li>
              <li>Business data (name, venues, menus, dishes, prices, photos you upload)</li>
              <li>Payment data via Stripe (we do not store full card details)</li>
            </ul>
            <p>For guests viewing the public menu (no login):</p>
            <ul>
              <li>Technical logs (IP, browser) for security and statistics — no personal name</li>
              <li>Call waiter requests (venue, table/room, time)</li>
            </ul>

            <h2>3. Why we use it</h2>
            <ul>
              <li>Providing the service (account, menu, QR, notifications)</li>
              <li>Subscription billing</li>
              <li>Customer support</li>
              <li>Platform security and abuse prevention</li>
            </ul>

            <h2>4. Legal basis (GDPR)</h2>
            <p>
              We process data to perform our contract with you (SaaS provision), we have legitimate interest for
              security and, where required, your consent for marketing emails (if enabled in the future).
            </p>

            <h2>5. Third parties</h2>
            <ul>
              <li>Stripe — subscription payment processing</li>
              <li>Hosting / email providers — only as needed to operate the service</li>
            </ul>
            <p>We do not sell your personal data.</p>

            <h2>6. Retention</h2>
            <p>
              We keep account data while you are an active customer and for a reasonable period after termination
              for accounting and legal reasons. You may request deletion by contacting us.
            </p>

            <h2>7. Your rights</h2>
            <p>
              You have the right of access, rectification, erasure, restriction, portability and objection under
              GDPR. Contact{" "}
              <a href={`tel:${SEO_SITE.contactPhoneTel}`}>{SEO_SITE.contactPhone}</a> or{" "}
              <a href={`mailto:${SEO_SITE.contactEmail}`}>{SEO_SITE.contactEmail}</a>.
            </p>

            <h2>8. Cookies</h2>
            <p>
              We use essential cookies for dashboard login (session). We do not use marketing tracking cookies
              without consent.
            </p>

            <h2>9. Security</h2>
            <p>
              We apply technical and organisational measures (HTTPS, password encryption, tenant separation). No
              system is 100% secure — if you notice an issue, please tell us immediately.
            </p>
          </>
        ) : (
          <>
            <h2>1. Ποιοι είμαστε</h2>
            <p>
              Το MenuOS (menuos.gr) είναι online πλατφόρμα ψηφιακών menus. Υπεύθυνος επεξεργασίας για τους
              επιχειρηματικούς λογαριασμούς είναι η ομάδα που λειτουργεί το MenuOS. Για ερωτήσεις:{" "}
              <a href={`tel:${SEO_SITE.contactPhoneTel}`}>{SEO_SITE.contactPhone}</a>,{" "}
              <a href={`mailto:${SEO_SITE.contactEmail}`}>{SEO_SITE.contactEmail}</a>.
            </p>

            <h2>2. Τι δεδομένα συλλέγουμε</h2>
            <p>Για επιχειρήσεις που εγγράφονται:</p>
            <ul>
              <li>Στοιχεία λογαριασμού (όνομα, email, κωδικός σε κρυπτογραφημένη μορφή)</li>
              <li>Στοιχεία επιχείρησης (επωνυμία, venues, menus, πιάτα, τιμές, φωτογραφίες που ανεβάζετε)</li>
              <li>Στοιχεία πληρωμής μέσω Stripe (δεν αποθηκεύουμε πλήρη στοιχεία κάρτας)</li>
            </ul>
            <p>Για επισκέπτες που βλέπουν public menu (χωρίς login):</p>
            <ul>
              <li>Τεχνικά logs (IP, browser) για ασφάλεια και στατιστική — όχι ονοματεπώνυμο</li>
              <li>Αιτήματα call waiter (venue, τραπέζι/δωμάτιο, χρόνος)</li>
            </ul>

            <h2>3. Γιατί τα χρησιμοποιούμε</h2>
            <ul>
              <li>Παροχή της υπηρεσίας (λογαριασμός, menu, QR, ειδοποιήσεις)</li>
              <li>Τιμολόγηση συνδρομής</li>
              <li>Υποστήριξη πελατών</li>
              <li>Ασφάλεια πλατφόρμας και πρόληψη κατάχρησης</li>
            </ul>

            <h2>4. Νομική βάση (GDPR)</h2>
            <p>
              Εκτελούμε σύμβαση μαζί σας (παροχή SaaS), έχουμε έννομο συμφέρον για ασφάλεια και, όπου
              απαιτείται, τη συγκατάθεσή σας για marketing emails (αν ενεργοποιηθούν στο μέλλον).
            </p>

            <h2>5. Κοινοποίηση σε τρίτους</h2>
            <ul>
              <li>Stripe — επεξεργασία πληρωμών συνδρομής</li>
              <li>Πάροχοι hosting / email — μόνο όσο χρειάζεται για τη λειτουργία</li>
            </ul>
            <p>Δεν πουλάμε τα προσωπικά σας δεδομένα.</p>

            <h2>6. Διάρκεια διατήρησης</h2>
            <p>
              Κρατάμε δεδομένα λογαριασμού όσο είστε ενεργός πελάτης και για reasonable period μετά τη λήξη, για
              λογιστικούς και νομικούς λόγους. Μπορείτε να ζητήσετε διαγραφή επικοινωνώντας μαζί μας.
            </p>

            <h2>7. Τα δικαιώματά σας</h2>
            <p>
              Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης — σύμφωνα
              με τον GDPR. Επικοινωνήστε στο{" "}
              <a href={`tel:${SEO_SITE.contactPhoneTel}`}>{SEO_SITE.contactPhone}</a> ή{" "}
              <a href={`mailto:${SEO_SITE.contactEmail}`}>{SEO_SITE.contactEmail}</a>.
            </p>

            <h2>8. Cookies</h2>
            <p>
              Χρησιμοποιούμε απαραίτητα cookies για σύνδεση στο dashboard (session). Δεν χρησιμοποιούμε tracking
              cookies marketing χωρίς συγκατάθεση.
            </p>

            <h2>9. Ασφάλεια</h2>
            <p>
              Εφαρμόζουμε τεχνικά και οργανωτικά μέτρα (HTTPS, κρυπτογράφηση κωδικών, διαχωρισμός tenants). Κανένα
              σύστημα δεν είναι 100% ασφαλές — αν διαπιστώσετε πρόβλημα, ενημερώστε μας άμεσα.
            </p>
          </>
        )}
      </MarketingLegalDocument>
    </MarketingLayout>
  );
}
