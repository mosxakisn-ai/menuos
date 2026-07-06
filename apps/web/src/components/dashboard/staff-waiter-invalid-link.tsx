import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function StaffWaiterInvalidLink({
  venueSlug,
  invalidKey = false,
  subscriptionInactive = false,
  proRequired = false,
  missingTabletScreen = false,
  invalidAssignment = false,
}: {
  venueSlug: string;
  invalidKey?: boolean;
  subscriptionInactive?: boolean;
  proRequired?: boolean;
  missingTabletScreen?: boolean;
  invalidAssignment?: boolean;
}) {
  const settingsStaff = "/dashboard/settings?tab=staff";

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface/40 px-4">
      <div className="max-w-md rounded-card border border-slate-200 bg-white p-6 text-center shadow-soft">
        <div className="flex justify-center">
          <Logo href={false} markSize={36} className="gap-2.5" wordmarkClassName="text-lg leading-none" />
        </div>
        <h1 className="mt-3 font-serif text-xl font-bold text-primary">
          {missingTabletScreen ? "Οθόνη tablet" : "Σύνδεσμος προσωπικού"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {proRequired ? (
            <>
              Το Live 360° (οθόνες και κλήσεις σερβιτόρου) είναι διαθέσιμο μόνο στο πλάνο Pro. Ζήτησε από τον
              διαχειριστή να αναβαθμίσει τη συνδρομή.
            </>
          ) : subscriptionInactive ? (
            <>
              Η συνδρομή του καταστήματος δεν είναι ενεργή — το panel δεν είναι διαθέσιμο. Επικοινώνησε με τον
              υπεύθυνο για ανανέωση συνδρομής.
            </>
          ) : missingTabletScreen ? (
            <>
              Δεν υπάρχει link tablet για αυτό το πόστο. Ο υπεύθυνος πρέπει να ελέγξει το{" "}
              <strong>Προσωπικό</strong> και τα <strong>Πόστα</strong> και να σου στείλει το σωστό link.
            </>
          ) : invalidAssignment ? (
            <>
              Το πόστο σου δεν είναι πλέον ενεργό. Ζήτησε από τον υπεύθυνο να ενημερώσει το{" "}
              <strong>Προσωπικό</strong> και νέο link.
            </>
          ) : invalidKey ? (
            <>
              Ο κωδικός στον σύνδεσμο δεν είναι έγκυρος ή έληξε. Ζήτησε νέο{" "}
              <strong>προσωπικό link</strong> από τον υπεύθυνο (Ρυθμίσεις → Προσωπικό).
            </>
          ) : (
            <>
              Αυτός ο σύνδεσμος δεν είναι έγκυρος ή έληξε. Χρησιμοποίησε τον <strong>πλήρη σύνδεσμο</strong> από
              Ρυθμίσεις → Προσωπικό — όχι μόνο το <code className="text-xs">/s/{venueSlug}</code>.
            </>
          )}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Τοπική ανάπτυξη: άνοιξε <code className="text-xs">http://localhost:3000</code> (όχι{" "}
          <code className="text-xs">0.0.0.0</code>). Στο κινητό χρησιμοποίησε την IP του PC στο Wi‑Fi.
        </p>
        <Link
          href={settingsStaff}
          className="mt-5 inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          Ρυθμίσεις → Προσωπικό
        </Link>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(settingsStaff)}`}
          className="mt-3 block text-xs text-slate-500 hover:text-brand-blue hover:underline"
        >
          Σύνδεση διαχειριστή
        </Link>
      </div>
    </div>
  );
}
