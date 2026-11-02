"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * t77: shared scroll-spy for section navs (company report, seller details). The active section is the last one whose
 * top has passed `offset`; at the bottom of the page the last section wins. `go` smooth-scrolls (opening collapsed
 * <details>) and holds the highlight on the clicked item until the scroll settles.
 */
export function useScrollSpy(ids: string[], offset = 140) {
  const [active, setActive] = useState(ids[0] ?? "");
  const lock = useRef<number | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    const list = key ? key.split("|") : [];
    let frame = 0;
    function spy() {
      frame = 0;
      if (lock.current !== null) {
        return;
      }
      let current = list[0] ?? "";
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.offsetParent !== null && el.getBoundingClientRect().top - offset <= 0) {
          current = id;
        }
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom && window.scrollY > 0 ? (list.at(-1) ?? current) : current);
    }
    function onScroll() {
      if (!frame) {
        frame = window.requestAnimationFrame(spy);
      }
    }
    spy();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [key, offset]);

  const go = useCallback((id: string): boolean => {
    const target = document.getElementById(id);
    if (!target) {
      return false;
    }
    if (target instanceof HTMLDetailsElement && !target.open) {
      target.open = true;
    }
    setActive(id);
    if (lock.current !== null) {
      window.clearTimeout(lock.current);
    }
    lock.current = window.setTimeout(() => {
      lock.current = null;
    }, 900);
    target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    return true;
  }, []);

  return { active, setActive, go, reducedMotion };
}
