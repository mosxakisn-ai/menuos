/** Greek user-facing messages for Stripe checkout init failures. */
export function userFacingCheckoutError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/logo URL path must end|image URL path must end/i.test(message)) {
    return "Προσωρινό πρόβλημα με τη σελίδα πληρωμής. Δοκίμασε ξανά σε λίγο.";
  }
  if (/branding_settings/i.test(message)) {
    return "Προσωρινό πρόβλημα με το branding της πληρωμής. Δοκίμασε ξανά.";
  }
  if (/No such price|Invalid API Key|api_key/i.test(message)) {
    return "Το σύστημα πληρωμών δεν είναι ρυθμισμένο σωστά. Επικοινώνησε με την υποστήριξη.";
  }
  if (/rate limit|too many requests/i.test(message)) {
    return "Πολλές προσπάθειες. Περίμενε λίγο και δοκίμασε ξανά.";
  }

  return "Δεν ήταν δυνατή η έναρξη πληρωμής. Δοκίμασε ξανά ή επικοινώνησε μαζί μας.";
}
