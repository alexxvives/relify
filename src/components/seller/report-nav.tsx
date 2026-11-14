"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type KeyboardEvent, type MouseEvent } from "react";
import { useScrollSpy } from "@/components/shell/use-scroll-spy";
import {
  Briefcase,
  ClipboardCheck,
  FileSpreadsheet,
  HandCoins,
  Images,
  LineChart,
  PieChart,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { GooeyNavItem } from "@/components/ui/gooey-nav/GooeyNav";

export type ReportNavItem = { id: string; label: string };

/** Icons match each ReportSection header, so the bar and the sections read as one system. */
const icons: Record<string, typeof Sparkles> = {
  resumen: Sparkles,
  negocio: Briefcase,
  evolucion: TrendingUp,
  rentabilidad: LineChart,
  solidez: ShieldCheck,
  balance: Scale,
  propiedad: PieChart,
  equipo: Users,
  operacion: HandCoins,
  revision: ClipboardCheck,
  detalle: FileSpreadsheet,
  galeria: Images,
};

/** Distance from the viewport top at which a section counts as "being read" (sticky bar + breathing room). */
const spyOffset = 140;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type GooeyProps = {
  items?: GooeyNavItem[];
  activeIndex?: number;
  onChange?: (index: number, item: GooeyNavItem) => void;
  theme?: "dark" | "light";
  color?: string;
  activeTextColor?: string;
  size?: "sm" | "md" | "lg";
  frame?: boolean;
  className?: string;
};

/**
 * Section bar for the company report. Always centered at max-w-4xl in flow, then
 * `position: sticky` so it does not jump or re-center when it pins.
 */
export function ReportNav({
  items,
  label,
  belowFloatingTabs = false,
}: {
  items: ReportNavItem[];
  label: string;
  /** Extra sticky offset when the report sits under a page header row. */
  belowFloatingTabs?: boolean;
}) {
  const ids = items.map((item) => item.id);
  const { active, go: scrollTo } = useScrollSpy(ids, belowFloatingTabs ? spyOffset + 56 : spyOffset);
  const [edges, setEdges] = useState({ start: false, end: false });
  const track = useRef<HTMLDivElement>(null);
  const top = belowFloatingTabs ? "top-[7.75rem] sm:top-[8.25rem] lg:top-[5.25rem]" : "top-14 sm:top-16 lg:top-3";
  const [Gooey, setGooey] = useState<ComponentType<GooeyProps> | null>(null);
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === active));

  const measureEdges = useCallback(() => {
    const el = track.current;
    if (!el) {
      return;
    }
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    if (reducedMotion()) {
      return;
    }
    let alive = true;
    void import("@/components/ui/gooey-nav/GooeyNav").then((mod) => {
      if (alive) {
        setGooey(() => mod.default);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = track.current;
    const pill =
      el?.querySelector<HTMLElement>(`[data-section="${active}"]`) ??
      el?.querySelectorAll<HTMLElement>(".gooey-nav__list:not(.gooey-nav__list--active) .gooey-nav__item")[activeIndex];
    if (!el || !pill) {
      return;
    }
    const left = pill.offsetLeft - el.clientWidth / 2 + pill.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: reducedMotion() ? "auto" : "smooth" });
  }, [active, activeIndex]);

  useEffect(() => {
    measureEdges();
    window.addEventListener("resize", measureEdges);
    return () => window.removeEventListener("resize", measureEdges);
  }, [measureEdges]);

  function go(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (scrollTo(id)) {
      event.preventDefault();
      document.getElementById(id)?.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
    }
  }

  function keys(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? index + 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : null;
    if (next === null) {
      return;
    }
    event.preventDefault();
    const clamped = Math.min(items.length - 1, Math.max(0, next));
    const root = event.currentTarget.closest("nav");
    const links = root?.querySelectorAll<HTMLAnchorElement>("a[href^='#']");
    links?.[clamped]?.focus();
  }

  function pick(index: number) {
    const item = items[index];
    if (!item) {
      return;
    }
    if (scrollTo(item.id)) {
      document.getElementById(item.id)?.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
    }
  }

  const fade = `${edges.start ? "transparent 0, #000 2rem" : "#000 0"}, ${edges.end ? "#000 calc(100% - 2rem), transparent 100%" : "#000 100%"}`;
  const gooeyItems: GooeyNavItem[] = items.map((item) => {
    const Icon = icons[item.id] ?? Sparkles;
    return { label: item.label, icon: <Icon className="size-4" aria-hidden /> };
  });

  return (
    <nav aria-label={label} className={`sticky z-30 mx-auto w-full max-w-4xl ${top}`}>
      <div className="flex items-center gap-2 rounded-2xl border border-[#e6e9f0] bg-white/95 p-1.5 shadow-[0_1px_2px_rgba(28,39,64,0.04),0_8px_24px_-12px_rgba(28,39,64,0.28)] backdrop-blur">
        <div
          ref={track}
          onScroll={measureEdges}
          className="flex min-w-0 flex-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maskImage: `linear-gradient(to right, ${fade})`, WebkitMaskImage: `linear-gradient(to right, ${fade})` }}
        >
          {Gooey ? (
            <Gooey
              items={gooeyItems}
              activeIndex={activeIndex}
              onChange={(index) => {
                pick(index);
              }}
              theme="light"
              color="#1c2740"
              activeTextColor="#ffffff"
              size="sm"
              frame={false}
              className="gooey-nav--scroll"
            />
          ) : (
            <ul className="flex min-w-0 flex-1 gap-1">
              {items.map((item, index) => {
                const Icon = icons[item.id] ?? Sparkles;
                const current = item.id === active;
                return (
                  <li key={item.id} className="shrink-0">
                    <a
                      href={`#${item.id}`}
                      data-section={item.id}
                      aria-current={current ? "location" : undefined}
                      onClick={(event) => go(event, item.id)}
                      onKeyDown={(event) => keys(event, index)}
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
                        current ? "bg-[#1c2740] text-white shadow-sm" : "text-[#3d4a63] hover:bg-[#e6f4f2] hover:text-[#0f766e]"
                      }`}
                    >
                      <Icon className={`size-4 shrink-0 ${current ? "text-[#7fd6cc]" : "text-[#8b95a7]"}`} aria-hidden />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
