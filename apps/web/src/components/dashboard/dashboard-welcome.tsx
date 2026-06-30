"use client";

import { FlashMessages } from "@/components/dashboard/flash-message";

export function DashboardWelcome({ show }: { show?: boolean }) {
  if (!show) return null;

  return (
    <FlashMessages
      initial={{
        type: "info",
        text: "Καλώς ήρθες στο MenuOS! Ακολούθησε τον οδηγό εκκίνησης για να δημιουργήσεις το πρώτο σου venue και menu.",
      }}
    />
  );
}
