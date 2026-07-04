import type { DashboardLang } from "@/content/dashboard-i18n";

const FEATURE_EN: Record<string, string> = {
  "1 κατάστημα": "1 venue",
  "3 καταστήματα": "3 venues",
  "1 κατάλογος": "1 catalog",
  "3 κατάλογοι": "3 catalogs",
  "5 κατάλογοι": "5 catalogs",
  "Απεριόριστοι κατάλογοι": "Unlimited catalogs",
  "50 είδη": "50 items",
  "50 πιάτα": "50 items",
  "Απεριόριστα είδη": "Unlimited items",
  "Απεριόριστα extra": "Unlimited extras",
  "Απεριόριστα πιάτα": "Unlimited items",
  "QR codes": "QR codes",
  "Πολλαπλές γλώσσες": "Multiple languages",
  "Χωρίς κάρτα": "No card required",
  "Κλήση σερβιτόρου": "Call waiter",
  "Live 360°": "Live 360°",
  "Προτεραιότητα": "Priority support",
  "PDF import": "PDF import",
  "PDF import · Gemini AI": "PDF import · Gemini AI",
  "Εισαγωγή PDF · Gemini AI": "PDF import · Gemini AI",
  "Δικό σας domain": "Custom domain",
  "White-label": "White-label",
  "Προτεραιότητα υποστήριξης": "Priority support",
};

/** Normalize legacy «πιάτα» copy and localize plan bullets for dashboard. */
export function displayPlanFeature(feature: string, lang: DashboardLang): string {
  const normalized = feature
    .replace(/απεριόριστα πιάτα/gi, "Απεριόριστα είδη")
    .replace(/\b50 πιάτα\b/gi, "50 είδη")
    .replace(/\bπιάτα\b/gi, "είδη")
    .replace(/\bΠιάτα\b/g, "Είδη");

  if (lang === "EN") {
    return FEATURE_EN[normalized] ?? FEATURE_EN[feature] ?? normalized;
  }
  return normalized;
}
