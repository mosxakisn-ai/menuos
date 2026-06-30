"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  labelClassName?: string;
  wrapperClassName?: string;
};

export function PasswordField({
  label,
  labelClassName = "font-medium text-primary",
  wrapperClassName,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm">
      <span className={labelClassName}>{label}</span>
      <div className={wrapperClassName ?? "relative mt-1"}>
        <input
          {...inputProps}
          type={visible ? "text" : "password"}
          className={
            className ??
            "w-full rounded-button border border-slate-200 py-2.5 pl-3 pr-10 outline-none focus:border-primary"
          }
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={visible ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </label>
  );
}
