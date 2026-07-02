import { requestConfirmDialog } from "@/lib/confirm-dialog-store";
import {
  normalizeConfirmPrompt,
  type ConfirmPrompt,
  type ConfirmVariant,
} from "@/lib/confirm-dialog-types";

async function confirmWithVariant(
  prompt: ConfirmPrompt,
  variant: ConfirmVariant,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return requestConfirmDialog(normalizeConfirmPrompt(prompt, variant));
}

/** Premium confirm for irreversible actions (delete, revoke link, etc.). */
export async function confirmDestructive(prompt: ConfirmPrompt): Promise<boolean> {
  return confirmWithVariant(prompt, "destructive");
}

/** Same UX as destructive — rotate token / invalidate link warnings. */
export async function confirmWarning(prompt: ConfirmPrompt): Promise<boolean> {
  return confirmWithVariant(prompt, "warning");
}
