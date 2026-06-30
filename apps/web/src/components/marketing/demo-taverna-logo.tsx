import { cn } from "@/lib/utils";

type DemoTavernaLogoProps = {
  className?: string;
  size?: number;
  showName?: boolean;
  dark?: boolean;
  tagline?: string;
};

/** Branded mark for the seeded demo venue — used in marketing mockups. */
export function DemoTavernaLogo({
  className,
  size = 48,
  showName = false,
  dark = false,
  tagline = "Mediterranean cuisine",
}: DemoTavernaLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
        aria-hidden
      >
        <circle cx="24" cy="24" r="22" fill="#1e3a5f" />
        <circle cx="24" cy="24" r="20" stroke="#c9a227" strokeWidth="1.5" fill="none" />
        <path
          d="M16 30c2-8 6-12 8-12s6 4 8 12"
          stroke="#c9a227"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 22c1.5-3 3.5-4.5 4-4.5s2.5 1.5 4 4.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="24" cy="17" r="2.5" fill="#c9a227" />
        <path
          d="M14 32h20"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
      {showName ? (
        <div className="leading-tight">
          <p className={cn("text-sm font-bold tracking-tight", dark ? "text-white" : "text-brand-navy")}>
            Demo Taverna
          </p>
          <p className={cn("text-[10px] font-medium", dark ? "text-white/70" : "text-slate-500")}>
            {tagline}
          </p>
        </div>
      ) : null}
    </div>
  );
}
