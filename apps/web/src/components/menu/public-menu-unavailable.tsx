import Link from "next/link";
import { QR_MENU_UI, type QrMenuLanguage } from "@menuos/shared";

export function PublicMenuUnavailable({ language = "GR" }: { language?: QrMenuLanguage }) {
  const ui = QR_MENU_UI[language];
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="font-serif text-2xl font-bold text-primary">{ui.menuUnavailableTitle}</p>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">{ui.menuUnavailable}</p>
      <Link
        href="https://menuos.gr"
        className="mt-8 text-sm font-semibold text-brand-blue hover:underline"
      >
        menuos.gr
      </Link>
    </div>
  );
}
