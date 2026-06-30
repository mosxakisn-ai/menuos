type Props = {
  organizationName: string;
  logoUrl: string | null;
};

export function DashboardSidebarBrand({ organizationName, logoUrl }: Props) {
  const initial = organizationName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/10 object-cover"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-bold text-white"
            aria-hidden
          >
            {initial}
          </div>
        )}
        <p className="min-w-0 font-semibold leading-snug text-white">{organizationName}</p>
      </div>
    </div>
  );
}
