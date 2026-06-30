import Link from "next/link";

export function PublicMenuUnavailable({ venueName }: { venueName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="font-serif text-2xl font-bold text-primary">{venueName}</p>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
        Το ψηφιακό menu δεν είναι διαθέσιμο αυτή τη στιγμή. Επικοινώνησε με το κατάστημα για
        φυσικό menu ή περιμένετε να ενεργοποιηθεί ξανά η υπηρεσία.
      </p>
      <Link
        href="https://menuos.gr"
        className="mt-8 text-sm font-semibold text-brand-blue hover:underline"
      >
        menuos.gr
      </Link>
    </div>
  );
}
