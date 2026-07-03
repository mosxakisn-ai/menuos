"use client";

import {
  ITEM_LABEL_STYLES,
  isItemLabel,
  itemLabelText,
  type ItemLabel,
  type QrMenuLanguage,
} from "@menuos/shared";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { MenuItemPhotoPlaceholder } from "@/components/menu/menu-item-photo-placeholder";
import { optimizeMenuCardPhotoUrl } from "@/lib/menu-photo-url";
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

type MenuItemBaseProps = {
  name: string;
  description?: string | null;
  price: string;
  label?: string | null;
  lang: QrMenuLanguage;
  onClick?: () => void;
  className?: string;
};

/** Καθαρή γραμμή menu — για πιάτα χωρίς φωτογραφία (ποτά, συνοδευτικά κ.λπ.). */
export function MenuItemRow({
  name,
  description,
  price,
  label,
  lang,
  onClick,
  className,
}: MenuItemBaseProps) {
  const badge = isItemLabel(label) ? label : null;
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `${name}, €${price}` : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition",
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
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
  label,
  lang,
  onClick,
  className,
}: MenuItemBaseProps & { photoUrl: string }) {
  const badge = isItemLabel(label) ? label : null;
  const Comp = onClick ? "button" : "div";
  const [imgFailed, setImgFailed] = useState(false);
  const cardPhotoSrc = optimizeMenuCardPhotoUrl(photoUrl);

  useEffect(() => {
    setImgFailed(false);
  }, [photoUrl]);

  if (imgFailed) {
    return (
      <Comp
        type={onClick ? "button" : undefined}
        onClick={onClick}
        aria-label={onClick ? `${name}, €${price}` : undefined}
        className={cn(
          "w-full overflow-hidden rounded-card bg-white text-left shadow-soft transition hover:shadow-card",
          onClick && "cursor-pointer touch-manipulation active:scale-[0.99]",
          className,
        )}
      >
        <MenuItemPhotoPlaceholder size="lg" />
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

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `${name}, €${price}` : undefined}
      className={cn(
        "w-full overflow-hidden rounded-card bg-white text-left shadow-soft transition hover:shadow-card",
        onClick && "cursor-pointer touch-manipulation active:scale-[0.99]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardPhotoSrc}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 50vw, 280px"
          onError={() => setImgFailed(true)}
        />
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
