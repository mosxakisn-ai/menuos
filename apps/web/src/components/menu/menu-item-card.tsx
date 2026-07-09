"use client";

import {
  ITEM_LABEL_ICONS,
  ITEM_LABEL_STYLES,
  isItemLabel,
  itemLabelText,
  parseAllergenCodes,
  parseDietaryTags,
  type AllergenCode,
  type DietaryTag,
  type ItemLabel,
  type QrMenuLanguage,
} from "@menuos/shared";
import {
  Award,
  ChefHat,
  ChevronRight,
  Sparkles,
  Sun,
  Tag,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { MenuItemPhotoPlaceholder } from "@/components/menu/menu-item-photo-placeholder";
import { MenuItemTagRow } from "@/components/menu/menu-item-tags";
import { optimizeMenuCardPhotoUrl } from "@/lib/menu-photo-url";
import { cn } from "@/lib/utils";

const ITEM_LABEL_ICON_MAP: Record<ItemLabel, LucideIcon> = {
  OFFER: Tag,
  BEST: Award,
  NEW: Sparkles,
  CHEF: ChefHat,
  SEASONAL: Sun,
  RECOMMENDED: ThumbsUp,
};

export function ItemLabelBadge({
  label,
  lang,
  className,
}: {
  label: ItemLabel;
  lang: QrMenuLanguage;
  className?: string;
}) {
  const Icon = ITEM_LABEL_ICON_MAP[label];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        ITEM_LABEL_STYLES[label],
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {itemLabelText(label, lang)}
    </span>
  );
}

void ITEM_LABEL_ICONS;

type MenuItemBaseProps = {
  name: string;
  description?: string | null;
  price: string;
  label?: string | null;
  dietaryTags?: unknown;
  allergenCodes?: unknown;
  lang: QrMenuLanguage;
  onClick?: () => void;
  className?: string;
};

function interactiveCardProps(name: string, price: string, onClick?: () => void) {
  if (!onClick) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    "aria-label": `${name}, €${price}`,
  };
}

function MenuItemCardBody({
  name,
  description,
  price,
  dietaryTags,
  allergenCodes,
  lang,
}: {
  name: string;
  description?: string | null;
  price: string;
  dietaryTags: DietaryTag[];
  allergenCodes: AllergenCode[];
  lang: QrMenuLanguage;
}) {
  return (
    <div className="flex flex-col p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 font-medium leading-snug text-primary">{name}</p>
        <p className="shrink-0 font-semibold tabular-nums text-primary">€{price}</p>
      </div>
      {description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{description}</p>
      ) : null}
      <MenuItemTagRow
        dietaryTags={dietaryTags}
        allergenCodes={allergenCodes}
        lang={lang}
        className={description ? "mt-2" : "mt-1.5"}
      />
    </div>
  );
}

/** Καθαρή γραμμή menu — για πιάτα χωρίς φωτογραφία (ποτά, συνοδευτικά κ.λπ.). */
export function MenuItemRow({
  name,
  description,
  price,
  label,
  dietaryTags,
  allergenCodes,
  lang,
  onClick,
  className,
}: MenuItemBaseProps) {
  const badge = isItemLabel(label) ? label : null;
  const tags = parseDietaryTags(dietaryTags);
  const allergens = parseAllergenCodes(allergenCodes);
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `${name}, €${price}` : undefined}
      className={cn(
        "flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition",
        onClick && "cursor-pointer touch-manipulation hover:bg-slate-50 active:bg-slate-100",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-primary">{name}</p>
          {badge ? <ItemLabelBadge label={badge} lang={lang} /> : null}
        </div>
        {description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{description}</p>
        ) : null}
        <MenuItemTagRow
          dietaryTags={tags}
          allergenCodes={allergens}
          lang={lang}
          className="mt-1.5"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <p className="font-semibold text-primary">€{price}</p>
        {onClick ? <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden /> : null}
      </div>
    </Comp>
  );
}

/** Κάρτα με φωτογραφία — μόνο όταν υπάρχει πραγματική εικόνα. */
export function MenuItemCard({
  name,
  description,
  price,
  photoUrl,
  photoDisplayWidth = 240,
  photoSizes = "(max-width: 640px) 100vw, 260px",
  label,
  dietaryTags,
  allergenCodes,
  lang,
  onClick,
  className,
}: MenuItemBaseProps & {
  photoUrl: string;
  photoDisplayWidth?: number;
  photoSizes?: string;
}) {
  const badge = isItemLabel(label) ? label : null;
  const tags = parseDietaryTags(dietaryTags);
  const allergens = parseAllergenCodes(allergenCodes);
  const [imgFailed, setImgFailed] = useState(false);
  const cardPhotoSrc = optimizeMenuCardPhotoUrl(photoUrl, photoDisplayWidth);
  const cardClassName = cn(
    "w-full overflow-hidden rounded-card bg-white text-left shadow-soft transition hover:shadow-card",
    onClick && "cursor-pointer touch-manipulation active:scale-[0.99]",
    className,
  );

  useEffect(() => {
    setImgFailed(false);
  }, [photoUrl]);

  if (imgFailed) {
    return (
      <div className={cardClassName} {...interactiveCardProps(name, price, onClick)}>
        <MenuItemPhotoPlaceholder size="lg" />
        <MenuItemCardBody
          name={name}
          description={description}
          price={price}
          dietaryTags={tags}
          allergenCodes={allergens}
          lang={lang}
        />
      </div>
    );
  }

  return (
    <div className={cardClassName} {...interactiveCardProps(name, price, onClick)}>
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardPhotoSrc}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          sizes={photoSizes}
          onError={() => setImgFailed(true)}
        />
        {badge ? (
          <div className="absolute left-2 top-2">
            <ItemLabelBadge label={badge} lang={lang} />
          </div>
        ) : null}
      </div>
      <MenuItemCardBody
        name={name}
        description={description}
        price={price}
        dietaryTags={tags}
        allergenCodes={allergens}
        lang={lang}
      />
    </div>
  );
}
