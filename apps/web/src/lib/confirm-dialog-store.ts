import type { ConfirmDialogContent } from "@/lib/confirm-dialog-types";

export type PendingConfirm = {
  content: ConfirmDialogContent;
  resolve: (confirmed: boolean) => void;
};

type Pending = PendingConfirm;

let pending: Pending | null = null;
let listeners: Array<(state: Pending | null) => void> = [];

export function subscribeConfirmDialog(listener: (state: Pending | null) => void) {
  listeners.push(listener);
  listener(pending);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify() {
  for (const listener of listeners) listener(pending);
}

export function requestConfirmDialog(content: ConfirmDialogContent): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    pending = { content, resolve };
    notify();
  });
}

export function resolveConfirmDialog(confirmed: boolean) {
  if (!pending) return;
  const { resolve } = pending;
  pending = null;
  notify();
  resolve(confirmed);
}

export function getPendingConfirmDialog() {
  return pending;
}
