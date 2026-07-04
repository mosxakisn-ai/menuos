"use client";

import { CUISINE_TYPES, type CuisineType } from "@menuos/shared";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { cn } from "@/lib/utils";

type Props = {
  value?: CuisineType | "" | null;
  onChange?: (value: CuisineType | "") => void;
  name?: string;
  required?: boolean;
  className?: string;
  id?: string;
};

export function CuisineTypeSelect({ value, onChange, name, required, className, id }: Props) {
  const { d } = useDashboardCopy();
  const C = d.cuisineType;
  const selected = value ?? "";

  return (
    <label className={cn("block", className)}>
      <span className={dashboardLabelClass}>{C.label}</span>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{C.hint}</p>
      <select
        id={id}
        name={name}
        required={required}
        value={selected}
        onChange={
          onChange
            ? (e) => {
                const next = e.target.value;
                onChange(next && CUISINE_TYPES.includes(next as CuisineType) ? (next as CuisineType) : "");
              }
            : undefined
        }
        className={cn(dashboardFieldClass, "mt-2")}
      >
        <option value="">{C.unsetOption}</option>
        {CUISINE_TYPES.map((typeId) => (
          <option key={typeId} value={typeId}>
            {C.options[typeId]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function cuisineTypePanelLabel(
  type: CuisineType | null | undefined,
  options: Record<CuisineType, string>,
): string | null {
  if (!type) return null;
  return options[type] ?? null;
}
