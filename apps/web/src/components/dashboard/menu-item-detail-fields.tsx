"use client";

import {
  ALLERGEN_CODE_OPTIONS,
  DIETARY_TAG_OPTIONS,
  type AllergenCode,
  type DietaryTag,
} from "@menuos/shared";
import {
  dashboardInputClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { cn } from "@/lib/utils";

export type MenuItemDetailFormValue = {
  descriptionGr: string;
  ingredientsGr: string;
  dietaryTags: DietaryTag[];
  allergenCodes: AllergenCode[];
};

export function MenuItemDetailFields({
  value,
  onChange,
}: {
  value: MenuItemDetailFormValue;
  onChange: (next: MenuItemDetailFormValue) => void;
}) {
  const { d } = useDashboardCopy();
  const M = d.menuEditor;

  function toggleDietary(tag: DietaryTag) {
    const has = value.dietaryTags.includes(tag);
    onChange({
      ...value,
      dietaryTags: has
        ? value.dietaryTags.filter((t) => t !== tag)
        : [...value.dietaryTags, tag],
    });
  }

  function toggleAllergen(code: AllergenCode) {
    const has = value.allergenCodes.includes(code);
    onChange({
      ...value,
      allergenCodes: has
        ? value.allergenCodes.filter((c) => c !== code)
        : [...value.allergenCodes, code],
    });
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className={dashboardLabelClass}>{M.itemDescription}</span>
        <textarea
          value={value.descriptionGr}
          onChange={(e) => onChange({ ...value, descriptionGr: e.target.value })}
          placeholder={FORM_PLACEHOLDERS.itemDescription}
          rows={2}
          maxLength={1000}
          className={`${dashboardInputClass} min-h-[4.5rem] resize-y`}
        />
        <p className="mt-1 text-[11px] text-slate-500">{M.itemDescriptionHint}</p>
      </label>

      <label className="block">
        <span className={dashboardLabelClass}>{M.itemIngredients}</span>
        <textarea
          value={value.ingredientsGr}
          onChange={(e) => onChange({ ...value, ingredientsGr: e.target.value })}
          placeholder={M.itemIngredientsPlaceholder}
          rows={2}
          maxLength={500}
          className={`${dashboardInputClass} min-h-[3.5rem] resize-y`}
        />
      </label>

      <div>
        <span className={dashboardLabelClass}>{M.dietaryTagsTitle}</span>
        <p className="mt-0.5 text-[11px] text-slate-500">{M.dietaryTagsHint}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DIETARY_TAG_OPTIONS.map((opt) => {
            const active = value.dietaryTags.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleDietary(opt.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  active
                    ? "border-brand-blue bg-blue-50 text-brand-navy"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {opt.dashboardGr}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className={dashboardLabelClass}>{M.allergenCodesTitle}</span>
        <p className="mt-0.5 text-[11px] text-slate-500">{M.allergenCodesHint}</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {ALLERGEN_CODE_OPTIONS.map((opt) => {
            const checked = value.allergenCodes.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition",
                  checked
                    ? "border-rose-300 bg-rose-50/80 text-rose-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAllergen(opt.value)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600"
                />
                <span className="leading-tight">{opt.dashboardGr}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
