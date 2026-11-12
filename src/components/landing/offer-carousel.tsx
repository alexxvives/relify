"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MarketCard } from "@/components/investor/market-card";
import type { PublicProjectCard } from "@/lib/public-project";
import { landingPreviewHref } from "@/lib/showcase-card";

export function OfferCarousel({ projects }: { projects: readonly PublicProjectCard[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((next: number) => {
    const node = scrollerRef.current;
    const item = node?.children[next];
    if (!(item instanceof HTMLElement) || !node) {
      return;
    }
    node.scrollTo({ left: item.offsetLeft, behavior: "smooth" });
    indexRef.current = next;
    setIndex(next);
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }
    const onScroll = () => {
      const cards = [...node.children];
      let best = 0;
      let dist = Number.POSITIVE_INFINITY;
      cards.forEach((child, i) => {
        if (!(child instanceof HTMLElement)) {
          return;
        }
        const delta = Math.abs(child.offsetLeft - node.scrollLeft);
        if (delta < dist) {
          dist = delta;
          best = i;
        }
      });
      indexRef.current = best;
      setIndex(best);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || projects.length < 2) {
      return;
    }
    const id = window.setInterval(() => {
      if (pausedRef.current) {
        return;
      }
      const next = (indexRef.current + 1) % projects.length;
      goTo(next);
    }, 5200);
    return () => window.clearInterval(id);
  }, [goTo, projects.length]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <div className="sm:hidden">
      <ul
        ref={scrollerRef}
        className="releva-offer-snap"
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerCancel={resume}
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        {projects.map((project) => (
          <li key={project.slug}>
            <MarketCard project={project} href={landingPreviewHref} />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Fichas de ejemplo">
        {projects.map((project, i) => (
          <button
            key={project.slug}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Ficha ${i + 1} de ${projects.length}`}
            className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-[#0f766e]" : "w-2 bg-[#cfe6e3]"}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
