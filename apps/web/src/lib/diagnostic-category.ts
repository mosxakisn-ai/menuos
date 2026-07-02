export function inferDiagnosticCategoryFromPath(pathname: string): string {
  if (pathname.includes("/menus/import")) return "pdf_import";
  if (pathname.includes("/menus")) return "catalog";
  if (pathname.includes("/billing")) return "billing";
  if (pathname.includes("/qr")) return "qr";
  if (pathname.includes("/waiter")) return "waiter";
  if (pathname.includes("/settings")) return "settings";
  if (pathname.includes("/dashboard")) return "dashboard";
  return "unknown";
}
