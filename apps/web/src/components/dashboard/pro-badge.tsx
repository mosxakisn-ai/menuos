import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ProBadgeProps = {
  className?: string;
  size?: "xs" | "sm";
};

export function ProBadge({ className, size = "xs" }: ProBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-brand-gradient font-bold uppercase tracking-[0.14em] text-white shadow-sm ring-1 ring-white/40",
        size === "xs" && "gap-0.5 px-1.5 py-0.5 text-[9px] leading-none",
        size === "sm" && "gap-1 px-2.5 py-1 text-[10px] tracking-wide",
        className,
      )}
    >
      <Sparkles
        className={cn("opacity-95", size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3")}
        aria-hidden
      />
      Pro
    </span>
  );
}
