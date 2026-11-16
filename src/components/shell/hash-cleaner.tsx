"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Internal links may still point at a section (`/inversor/perfil#busqueda`). This scrolls to the
 * section once it renders and then drops the `#…` from the address bar, so the app never shows
 * hash sub-URLs. Components that react to a hash (e.g. `#firmar`) read it on mount, before this runs.
 */
export function HashCleaner() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function strip() {
      const { hash, pathname: path, search: query } = window.location;

      if (!hash || hash === "#") {
        return;
      }

      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;

      const attempt = () => {
        if (cancelled) {
          return;
        }

        const target = document.getElementById(id);

        if (target) {
          // t84: report sections start collapsed; open the one the hash points at.
          if (target instanceof HTMLDetailsElement) target.open = true;
          target.scrollIntoView({ block: "start" });
        }

        if (target || tries >= 20) {
          // Let hash-aware components read it first, then clean the URL.
          timer = setTimeout(() => {
            if (window.location.hash === hash) {
              window.history.replaceState(window.history.state, "", `${path}${query}`);
            }
          }, 150);
          return;
        }

        tries += 1;
        timer = setTimeout(attempt, 100);
      };

      attempt();
    }

    strip();
    window.addEventListener("hashchange", strip);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("hashchange", strip);
    };
  }, [pathname, search]);

  return null;
}
