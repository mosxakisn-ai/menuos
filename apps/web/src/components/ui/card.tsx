import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-slate-100 bg-white p-6 shadow-card", className)}
      {...props}
    />
  );
}
