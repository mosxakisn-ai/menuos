import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-button text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "btn-gradient px-5 py-2.5",
        secondary:
          "border border-primary/20 bg-white px-5 py-2.5 text-primary hover:bg-surface",
        ghost: "px-4 py-2 text-primary hover:bg-surface",
        silver: "bg-brand-surface px-5 py-2.5 text-brand-navy hover:bg-slate-100 border border-slate-200",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export function buttonClass(variant?: VariantProps<typeof buttonVariants>["variant"], size?: VariantProps<typeof buttonVariants>["size"]) {
  return buttonVariants({ variant, size });
}
