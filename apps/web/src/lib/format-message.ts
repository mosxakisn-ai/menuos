/** Interpolate `{key}` placeholders in i18n strings (RSC-safe, no functions in copy). */
export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
