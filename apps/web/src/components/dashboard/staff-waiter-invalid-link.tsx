import Link from "next/link";

export function StaffWaiterInvalidLink({
  venueSlug,
  invalidKey = false,
  subscriptionInactive = false,
  proRequired = false,
}: {
  venueSlug: string;
  invalidKey?: boolean;
  subscriptionInactive?: boolean;
  proRequired?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface/40 px-4">
      <div className="max-w-md rounded-card border border-slate-200 bg-white p-6 text-center shadow-soft">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">MenuOS</p>
        <h1 className="mt-2 font-serif text-xl font-bold text-primary">Σύνδεσμος σερβιτόρου</h1>
        <p className="mt-3 text-sm text-slate-600">
          {proRequired ? (
            <>
              Το Live 360° (οθόνες και κλήσεις σερβιτόρου) είναι διαθέσιμο μόνο στο πλάνο Pro. Ζήτησε από τον
              διαχειριστή να αναβαθμίσει τη συνδρομή.
            </>
          ) : subscriptionInactive ? (
            <>
              Η συνδρομή του καταστήματος δεν είναι ενεργή — το panel σερβιτόρου δεν είναι διαθέσιμο. Επικοινώνησε
              με τον υπεύθυνο για ανανέωση συνδρομής.
            </>
          ) : invalidKey ? (
            <>
              Ο κωδικός στον σύνδεσμο δεν είναι έγκυρος ή έληξε. Ζήτησε νέο{" "}
              <strong>προσωπικό link</strong> από τον υπεύθυνο (Ρυθμίσεις → Services).
            </>
          ) : (
            <>
              Αυτός ο σύνδεσμος δεν είναι έγκυρος ή έληξε. Χρησιμοποίησε τον <strong>πλήρη σύνδεσμο</strong>{" "}
              από Ρυθμίσεις → Services — όχι μόνο το{" "}
              <code className="text-xs">/s/{venueSlug}</code>.
            </>
          )}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Τοπική ανάπτυξη: άνοιξε <code className="text-xs">http://localhost:3000</code> (όχι{" "}
          <code className="text-xs">0.0.0.0</code>). Στο κινητό χρησιμοποίησε την IP του PC στο Wi‑Fi.
        </p>
        <Link
          href="/dashboard/settings?tab=staff"
          className="mt-5 inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          Ρυθμίσεις → Services
        </Link>
        <Link
          href="/login?callbackUrl=%2Fdashboard%2Fsettings%3Ftab%3Dservices"
          className="mt-3 block text-xs text-slate-500 hover:text-brand-blue hover:underline"
        >
          Σύνδεση διαχειριστή
        </Link>
      </div>
    </div>
  );
}
