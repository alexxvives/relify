"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useScrollSpy } from "@/components/use-scroll-spy";
import { ViewportPortal } from "@/components/viewport-portal";
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

/**
 * t72: sticky section bar for the company report. Pills with icons, scroll-spy highlight,
 * smooth scroll (opens collapsed sections first), horizontal scroll with fade edges when it
 * overflows, arrow-key / Home / End navigation between pills.
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
  const track = useRef<HTMLUListElement>(null);

  const measureEdges = useCallback(() => {
    const el = track.current;
    if (!el) {
      return;
    }
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  // Keep the active pill visible inside the horizontal track (without moving the page).
  useEffect(() => {
    const el = track.current;
    const pill = el?.querySelector<HTMLElement>(`[data-section="${active}"]`);
    if (!el || !pill) {
      return;
    }
    const left = pill.offsetLeft - el.clientWidth / 2 + pill.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: reducedMotion() ? "auto" : "smooth" });
  }, [active]);

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

  const fade = `${edges.start ? "transparent 0, #000 2rem" : "#000 0"}, ${edges.end ? "#000 calc(100% - 2rem), transparent 100%" : "#000 100%"}`;
  const top = belowFloatingTabs ? "top-[7.75rem] sm:top-[8.25rem] lg:top-[5.25rem]" : "top-14 sm:top-16 lg:top-3";

  return (
    <ViewportPortal>
    <nav
      aria-label={label}
      className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3 lg:left-[var(--layout-sidebar)] ${top}`}
    >
      <div className="pointer-events-auto w-full max-w-4xl">
        <div className="flex items-center gap-2 rounded-2xl border border-[#e6e9f0] bg-white/95 p-1.5 shadow-[0_1px_2px_rgba(28,39,64,0.04),0_8px_24px_-12px_rgba(28,39,64,0.28)] backdrop-blur">
          <ul
            ref={track}
            onScroll={measureEdges}
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maskImage: `linear-gradient(to right, ${fade})`, WebkitMaskImage: `linear-gradient(to right, ${fade})` }}
          >
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
        </div>
      </div>
    </nav>
    </ViewportPortal>
  );
}
