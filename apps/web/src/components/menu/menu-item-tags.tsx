"use client";

import {
  ALLERGEN_CODE_PILL_CLASS,
  DIETARY_TAG_PILL_CLASS,
  allergenCodeText,
  dietaryTagText,
  type AllergenCode,
  type DietaryTag,
  type QrMenuLanguage,
} from "@menuos/shared";
import {
  Baby,
  Flame,
  Leaf,
  MilkOff,
  Moon,
  Sprout,
  WheatOff,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DIETARY_ICON_MAP: Record<DietaryTag, LucideIcon> = {
  VEGETARIAN: Leaf,
  VEGAN: Sprout,
  GLUTEN_FREE: WheatOff,
  DAIRY_FREE: MilkOff,
  SPICY: Flame,
  HALAL: Moon,
  KIDS: Baby,
};

function DietaryTagPill({ tag, lang }: { tag: DietaryTag; lang: QrMenuLanguage }) {
  const Icon = DIETARY_ICON_MAP[tag];
  return (
    <span className={DIETARY_TAG_PILL_CLASS}>
      <Icon className="h-3 w-3 shrink-0 text-rose-500" aria-hidden />
      {dietaryTagText(tag, lang)}
    </span>
  );
}

function AllergenCodePill({ code, lang }: { code: AllergenCode; lang: QrMenuLanguage }) {
  return (
    <span className={ALLERGEN_CODE_PILL_CLASS}>
      <span className="text-[9px] font-bold text-rose-500" aria-hidden>
        !
      </span>
      {allergenCodeText(code, lang)}
    </span>
  );
}

export function MenuItemTagRow({
  dietaryTags,
  allergenCodes,
  lang,
  maxAllergens = 3,
  className,
}: {
  dietaryTags: DietaryTag[];
  allergenCodes: AllergenCode[];
  lang: QrMenuLanguage;
  maxAllergens?: number;
  className?: string;
}) {
  if (dietaryTags.length === 0 && allergenCodes.length === 0) return null;

  const visibleAllergens = allergenCodes.slice(0, maxAllergens);
  const hiddenAllergenCount = Math.max(0, allergenCodes.length - visibleAllergens.length);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {dietaryTags.map((tag) => (
        <DietaryTagPill key={tag} tag={tag} lang={lang} />
      ))}
      {visibleAllergens.map((code) => (
        <AllergenCodePill key={code} code={code} lang={lang} />
      ))}
      {hiddenAllergenCount > 0 ? (
        <span className={ALLERGEN_CODE_PILL_CLASS}>+{hiddenAllergenCount}</span>
      ) : null}
    </div>
  );
}
