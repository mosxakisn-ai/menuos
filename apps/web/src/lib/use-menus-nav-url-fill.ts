"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { inferDiagnosticCategoryFromPath } from "@/lib/diagnostic-category";
import { reportClientDiagnostic } from "@/lib/report-client-diagnostic";
import {
  buildMenusImportUrl,
  buildMenusPageUrl,
  menusNavParamsMatchUrl,
  type MenusNavParams,
} from "@/lib/menus-nav-url";

type NavMode = "catalog" | "import";

const NAV_LOOP_WINDOW_MS = 3_000;
const NAV_LOOP_THRESHOLD = 6;

/** One-time URL fill when venue/menu state is known but query params are missing — avoids replace loops. */
export function useMenusNavUrlFill(
  mode: NavMode,
  params: MenusNavParams,
  enabled = true,
): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filledRef = useRef(false);
  const replaceTimesRef = useRef<number[]>([]);
  const loopReportedRef = useRef(false);
  const buildUrl = mode === "import" ? buildMenusImportUrl : buildMenusPageUrl;

  useEffect(() => {
    filledRef.current = false;
    loopReportedRef.current = false;
    replaceTimesRef.current = [];
  }, [params.venueId]);

  useEffect(() => {
    if (!enabled || !params.venueId || !params.menuId) return;
    if (menusNavParamsMatchUrl(params, searchParams)) {
      filledRef.current = true;
      return;
    }
    if (filledRef.current) return;

    const now = Date.now();
    replaceTimesRef.current = replaceTimesRef.current.filter((t) => now - t < NAV_LOOP_WINDOW_MS);
    replaceTimesRef.current.push(now);

    if (replaceTimesRef.current.length >= NAV_LOOP_THRESHOLD) {
      if (!loopReportedRef.current) {
        loopReportedRef.current = true;
        reportClientDiagnostic({
          severity: "WARN",
          source: "client_nav",
          category:
            typeof window !== "undefined"
              ? inferDiagnosticCategoryFromPath(window.location.pathname)
              : "catalog",
          message: "Πιθανό loop πλοήγησης καταλόγου/import — σταμάτησε αυτόματα.",
          errorCode: "nav_loop",
          context: {
            url: typeof window !== "undefined" ? window.location.href : undefined,
            mode,
            venueId: params.venueId,
            menuId: params.menuId,
            replacesInWindow: replaceTimesRef.current.length,
          },
        });
      }
      filledRef.current = true;
      return;
    }

    filledRef.current = true;
    router.replace(buildUrl(params), { scroll: false });
  }, [enabled, params.venueId, params.menuId, buildUrl, router, searchParams, mode]);
}
