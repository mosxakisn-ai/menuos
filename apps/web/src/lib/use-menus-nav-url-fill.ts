"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildMenusImportUrl,
  buildMenusPageUrl,
  menusNavParamsMatchUrl,
  type MenusNavParams,
} from "@/lib/menus-nav-url";

type NavMode = "catalog" | "import";

/** One-time URL fill when venue/menu state is known but query params are missing — avoids replace loops. */
export function useMenusNavUrlFill(
  mode: NavMode,
  params: MenusNavParams,
  enabled = true,
): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filledRef = useRef(false);
  const buildUrl = mode === "import" ? buildMenusImportUrl : buildMenusPageUrl;

  useEffect(() => {
    filledRef.current = false;
  }, [params.venueId]);

  useEffect(() => {
    if (!enabled || !params.venueId || !params.menuId) return;
    if (menusNavParamsMatchUrl(params, searchParams)) {
      filledRef.current = true;
      return;
    }
    if (filledRef.current) return;
    filledRef.current = true;
    router.replace(buildUrl(params), { scroll: false });
  }, [enabled, params.venueId, params.menuId, buildUrl, router, searchParams]);
}
