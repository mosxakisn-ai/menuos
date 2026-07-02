export type ConfirmVariant = "destructive" | "warning";

export type ConfirmDialogContent = {
  variant?: ConfirmVariant | string;
  eyebrow?: string;
  title: string;
  description?: string;
  bullets?: string[];
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type ConfirmPrompt = string | ConfirmDialogContent;

export function isConfirmDialogContent(value: ConfirmPrompt): value is ConfirmDialogContent {
  return typeof value === "object" && value !== null && "title" in value;
}

/** Turn legacy newline confirm strings into structured dialog content. */
export function parseLegacyConfirmMessage(message: string): ConfirmDialogContent {
  const lines = message.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);

  let start = 0;
  let eyebrow: string | undefined;
  const first = nonEmpty[0] ?? "Επιβεβαίωση";
  if (/^(ΠΡΟΣΟΧΗ|WARNING)/i.test(first)) {
    eyebrow = first.replace(/—.*/, "").trim();
    start = 1;
  }

  const bullets: string[] = [];
  const body: string[] = [];
  for (let i = start; i < nonEmpty.length; i += 1) {
    const line = nonEmpty[i]!;
    if (line.startsWith("•")) {
      bullets.push(line.replace(/^•\s*/, ""));
      continue;
    }
    if (/^(Συνέχεια|Continue)\?$/i.test(line)) continue;
    body.push(line);
  }

  const title = body[0] ?? first;
  const rest = body.slice(1);
  const note =
    rest.find((l) => /οριαστικά|permanent|δεν αναιρείται|cannot be undone|επαναφέρ/i.test(l)) ??
    rest[rest.length - 1];
  const descriptionParts = rest.filter((l) => l !== note);

  return {
    variant: eyebrow ? "destructive" : "warning",
    eyebrow,
    title,
    description: descriptionParts.length > 0 ? descriptionParts.join(" ") : undefined,
    bullets: bullets.length > 0 ? bullets : undefined,
    note: note !== title ? note : undefined,
  };
}

export function normalizeConfirmPrompt(
  prompt: ConfirmPrompt,
  variant: ConfirmVariant = "destructive",
): ConfirmDialogContent {
  if (isConfirmDialogContent(prompt)) {
    const resolvedVariant = (prompt.variant === "warning" ? "warning" : variant) as ConfirmVariant;
    return { ...prompt, variant: resolvedVariant };
  }
  const parsed = parseLegacyConfirmMessage(prompt);
  return { variant, ...parsed, ...("variant" in parsed ? {} : {}) };
}
