import { useId } from "react";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  size?: number;
};

/** QR-frame icon with M — matches MenuOS brand identity */
export function LogoMark({ className, size = 40 }: LogoMarkProps) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="10" fill={`url(#${gradientId})`} />
      {/* QR corner squares */}
      <rect x="8" y="8" width="10" height="10" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="30" y="8" width="10" height="10" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="8" y="30" width="10" height="10" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="11" y="11" width="4" height="4" rx="0.5" fill="#2563EB" />
      <rect x="33" y="11" width="4" height="4" rx="0.5" fill="#06B6D4" />
      <rect x="11" y="33" width="4" height="4" rx="0.5" fill="#06B6D4" />
      {/* dots */}
      <circle cx="26" cy="12" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="32" cy="18" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="22" cy="22" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="34" cy="28" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="22" cy="32" r="1.5" fill="white" fillOpacity="0.6" />
      {/* M */}
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        M
      </text>
    </svg>
  );
}
