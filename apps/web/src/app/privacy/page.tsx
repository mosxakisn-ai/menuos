import type { Metadata } from "next";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { MarketingLayout, MarketingProse } from "@/components/marketing/marketing-layout";
import { SEO_PAGES, SEO_SITE } from "@/content/seo-el";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.privacy);

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.privacy} />
      <MarketingProse>
        <h1>Πολιτική απορρήτου</h1>
        <p className="lead text-slate-600">Τελευταία ενημέρωση: Ιούνιος 2026</p>

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
          Εκτελούμε σύμβαση μαζί σας (παροχή SaaS), έχουμε έννομο συμφέρον για ασφάλεια και, όπου απαιτείται,
          τη συγκατάθεσή σας για marketing emails (αν ενεργοποιηθούν στο μέλλον).
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
          Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης — σύμφωνα με
          τον GDPR. Επικοινωνήστε στο{" "}
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
      </MarketingProse>
    </MarketingLayout>
  );
}
