import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItemPhotoPlaceholderProps = {
  /** sm = editor list thumb · lg = QR card / dialog hero */
  size?: "sm" | "lg";
  className?: string;
};

const iconSize = {
  sm: "h-5 w-5 sm:h-6 sm:w-6",
  lg: "h-10 w-10 sm:h-12 sm:w-12",
} as const;

/** Default dish placeholder when a catalog item has no photo. */
export function MenuItemPhotoPlaceholder({
  size = "sm",
  className,
}: MenuItemPhotoPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-brand-blue/[0.09] via-slate-50 to-cyan-400/[0.14]",
        "border border-brand-blue/12 ring-1 ring-inset ring-white/70",
        size === "sm" && "h-12 w-12 rounded-lg sm:h-14 sm:w-14",
        size === "lg" && "aspect-[4/3] w-full rounded-none border-0 ring-0",
        className,
      )}
      aria-hidden
    >
      <UtensilsCrossed
        className={cn(iconSize[size], "text-brand-blue/40")}
        strokeWidth={1.5}
      />
    </div>
  );
}
