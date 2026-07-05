import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { MarketingLayout, MarketingLegalDocument } from "@/components/marketing/marketing-layout";
import { SEO_SITE } from "@/content/seo-el";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { generateMarketingMetadata } from "@/lib/seo";
import { trialDayLabels } from "@/lib/trial-marketing";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";

export async function generateMetadata() {
  return generateMarketingMetadata("terms");
}

export default async function TermsPage() {
  const locale = await getServerLocale();
  const { marketing } = await getMessages(locale);
  const trialDays = await getTrialDaysFromCatalog();
  const { trialDaysGen } = trialDayLabels(trialDays);
  const isEn = locale === "en";
  const badge = marketing.footer.columns.legal;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="terms" />
      <MarketingLegalDocument
        title={isEn ? "Terms of use" : "Όροι χρήσης"}
        updated={isEn ? "Last updated: June 2026" : "Τελευταία ενημέρωση: Ιούνιος 2026"}
        badge={badge}
      >
        {isEn ? (
          <>
            <h2>1. Acceptance</h2>
            <p>
              By using menuos.gr and creating an account, you accept these terms. If you do not agree, do not use
              the service.
            </p>

            <h2>2. The service</h2>
            <p>
              MenuOS provides an online platform for digital QR menus, call waiter and related tools. The service
              is provided &quot;as is&quot;. We aim for high availability but do not guarantee uninterrupted
              operation.
            </p>

            <h2>3. Account & responsibility</h2>
            <ul>
              <li>Your account is personal/business — keep your password secure</li>
              <li>You are responsible for content you upload (dishes, prices, photos, allergens)</li>
              <li>Illegal, offensive or misleading content is not allowed</li>
            </ul>

            <h2>4. Subscriptions & payments</h2>
            <p>
              The {trialDays}-day trial is free according to the active plan. After that, Basic / Pro plans apply as
              listed on the pricing page. Payments are processed securely online. Cancel from the subscription page
              or contact us — no hidden setup fees.
            </p>

            <h2>5. Intellectual property</h2>
            <p>
              MenuOS, the logo and the platform belong to the MenuOS team. Content you upload (photos, text) remains
              yours — you grant us a licence to host it so we can provide the service.
            </p>

            <h2>6. Limitation of liability</h2>
            <p>
              We are not liable for indirect damages, loss of revenue or errors from incorrect menu information you
              enter (e.g. wrong allergens). We recommend reviewing content before publishing.
            </p>

            <h2>7. Termination</h2>
            <p>
              We may suspend accounts that violate these terms. You may cancel your subscription at any time — data
              is handled according to our privacy policy.
            </p>

            <h2>8. Changes</h2>
            <p>
              We may update these terms. Material changes will be announced on the site or by email. Continued use
              after changes means acceptance.
            </p>

            <h2>9. Governing law & contact</h2>
            <p>
              These terms are governed by Greek law. Questions:{" "}
              <a href={`tel:${SEO_SITE.contactPhoneTel}`}>{SEO_SITE.contactPhone}</a>,{" "}
              <a href={`mailto:${SEO_SITE.contactEmail}`}>{SEO_SITE.contactEmail}</a>.
            </p>
          </>
        ) : (
          <>
            <h2>1. Αποδοχή όρων</h2>
            <p>
              Χρησιμοποιώντας το menuos.gr και δημιουργώντας λογαριασμό, αποδέχεστε τους παρόντες όρους. Αν δεν
              συμφωνείτε, μην χρησιμοποιείτε την υπηρεσία.
            </p>

            <h2>2. Η υπηρεσία</h2>
            <p>
              Το MenuOS παρέχει online πλατφόρμα για δημιουργία και διαχείριση ψηφιακών menus με QR, call waiter
              και σχετικά εργαλεία. Η υπηρεσία παρέχεται «ως έχει». Προσπαθούμε για υψηλή διαθεσιμότητα αλλά δεν
              εγγυόμαστε αδιάλειπτη λειτουργία.
            </p>

            <h2>3. Λογαριασμός & ευθύνη</h2>
            <ul>
              <li>Ο λογαριασμός είναι προσωπικός/επιχειρηματικός — κρατάτε τον κωδικό ασφαλή</li>
              <li>Είστε υπεύθυνοι για το περιεχόμενο που ανεβάζετε (πιάτα, τιμές, φωτογραφίες, allergens)</li>
              <li>Δεν επιτρέπεται παράνομο, προσβλητικό ή παραπλανητικό περιεχόμενο</li>
            </ul>

            <h2>4. Συνδρομές & πληρωμές</h2>
            <p>
              Η δοκιμή {trialDaysGen} είναι δωρεάν σύμφωνα με το ενεργό πλάνο. Μετά, ισχύουν τα πλάνα Basic / Pro
              όπως αναγράφονται στη σελίδα τιμών. Οι πληρωμές γίνονται online με ασφάλεια. Η ακύρωση γίνεται από
              τη σελίδα συνδρομής ή επικοινωνώντας μαζί μας — δεν υπάρχουν «κρυφές» χρεώσεις εγκατάστασης.
            </p>

            <h2>5. Πνευματική ιδιοκτησία</h2>
            <p>
              Το MenuOS, το logo και η πλατφόρμα ανήκουν στην ομάδα MenuOS. Το περιεχόμενο που ανεβάζετε (φωτο,
              κείμενα) παραμένει δικό σας — μας δίνετε άδεια να το φιλοξενήσουμε για να παρέχουμε την υπηρεσία.
            </p>

            <h2>6. Περιορισμός ευθύνης</h2>
            <p>
              Δεν ευθυνόμαστε για έμμεσες ζημίες, απώλεια εσόδων ή λάθη που προκύπτουν από λανθαμένες πληροφορίες
              στο menu που εισάγετε εσείς (π.χ. λάθος allergens). Σας συνιστούμε να ελέγχετε το περιεχόμενο πριν
              το δημοσιεύσετε.
            </p>

            <h2>7. Διακοπή</h2>
            <p>
              Μπορούμε να αναστείλουμε λογαριασμό που παραβιάζει τους όρους. Μπορείτε να διακόψετε τη συνδρομή σας
              οποτεδήποτε — τα δεδομένα διαχειρίζονται σύμφωνα με την πολιτική απορρήτου.
            </p>

            <h2>8. Αλλαγές</h2>
            <p>
              Μπορούμε να ενημερώνουμε τους όρους. Σημαντικές αλλαγές θα ανακοινώνονται στο site ή με email. Η
              συνέχιση χρήσης μετά την αλλαγή σημαίνει αποδοχή.
            </p>

            <h2>9. Εφαρμοστέο δίκαιο & επικοινωνία</h2>
            <p>
              Οι όροι διέπονται από το ελληνικό δίκαιο. Για ερωτήσεις:{" "}
              <a href={`tel:${SEO_SITE.contactPhoneTel}`}>{SEO_SITE.contactPhone}</a>,{" "}
              <a href={`mailto:${SEO_SITE.contactEmail}`}>{SEO_SITE.contactEmail}</a>.
            </p>
          </>
        )}
      </MarketingLegalDocument>
    </MarketingLayout>
  );
}
