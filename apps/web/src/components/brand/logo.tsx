import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_TAGLINE } from "@/lib/config";
import { LogoMark } from "./logo-mark";

type LogoProps = {
  className?: string;
  showTagline?: boolean;
  dark?: boolean;
  href?: string | false;
  markSize?: number;
};

export function Logo({ className, showTagline = false, dark = false, href = "/", markSize = 40 }: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={markSize} />
      <div className="leading-tight">
        <p className="text-xl font-extrabold tracking-tight">
          <span className={dark ? "text-white" : "text-brand-navy"}>Menu</span>
          <span className="text-gradient-brand">Os</span>
        </p>
        {showTagline ? (
          <p className={cn("text-xs font-medium", dark ? "text-slate-400" : "text-slate-500")}>
            {APP_TAGLINE}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (href === false) return content;
  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}