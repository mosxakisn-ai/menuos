"use client";

import {
  ITEM_LABEL_STYLES,
  isItemLabel,
  itemLabelText,
  type ItemLabel,
  type QrMenuLanguage,
} from "@menuos/shared";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export function ItemLabelBadge({
  label,
  lang,
  className,
}: {
  label: ItemLabel;
  lang: QrMenuLanguage;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        ITEM_LABEL_STYLES[label],
        className,
      )}
    >
      {itemLabelText(label, lang)}
    </span>
  );
}

type MenuItemCardProps = {
  name: string;
  description?: string | null;
  price: string;
  photoUrl?: string | null;
  label?: string | null;
  lang: QrMenuLanguage;
  onClick?: () => void;
  className?: string;
};

export function MenuItemCard({
  name,
  description,
  price,
  photoUrl,
  label,
  lang,
  onClick,
  className,
}: MenuItemCardProps) {
  const badge = isItemLabel(label) ? label : null;
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `${name}, €${price}` : undefined}
      className={cn(
        "w-full overflow-hidden rounded-card bg-white text-left shadow-soft transition hover:shadow-card",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-slate-100 to-slate-200">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200">
            <UtensilsCrossed className="h-10 w-10 text-slate-300" aria-hidden />
          </div>
        )}
        {badge ? (
          <div className="absolute left-2 top-2">
            <ItemLabelBadge label={badge} lang={lang} />
          </div>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-primary">{name}</p>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        <p className="shrink-0 font-semibold text-primary">€{price}</p>
      </div>
    </Comp>
  );
}
