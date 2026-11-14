"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, MousePointer2, Search, Store } from "lucide-react";
import { landingCopy, type FlowRole } from "@/lib/landing-copy";

const pointerStops = [16, 50, 84];

const pathIcons = {
  vender: Store,
  comprar: Search,
  asesorar: Briefcase,
} as const;

function PathPointer() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const media = window.matchMedia("(min-width: 1024px)");
    let frame = 0;
    const tick = (now: number) => {
      if (!media.matches) {
        node.style.visibility = "hidden";
      } else {
        node.style.visibility = "visible";
        const slot = 1800;
        const index = Math.floor(now / slot) % pointerStops.length;
        const local = (now % slot) / slot;
        const from = pointerStops[index] ?? pointerStops[0];
        const to = pointerStops[(index + 1) % pointerStops.length] ?? from;
        let x = from;
        let pressed = false;
        if (local < 0.62) {
          pressed = local > 0.46 && local < 0.58;
        } else {
          const progress = (local - 0.62) / 0.38;
          const ease = progress * progress * (3 - 2 * progress);
          x = from + (to - from) * ease;
        }
        node.style.left = `${x}%`;
        node.style.transform = pressed ? "translate(-30%, 8px) scale(0.92)" : "translate(-30%, 0)";
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <span ref={ref} className="releva-path-cursor" aria-hidden="true">
      <MousePointer2 className="size-7 fill-white text-public-ink" />
    </span>
  );
}

export function Paths({
  role,
  onSelect,
  children = null,
}: {
  role: FlowRole;
  onSelect: (role: FlowRole) => void;
  children?: ReactNode;
}) {
  const copy = landingCopy.home.paths;
  const [hint, setHint] = useState(true);

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{copy.kicker}</p>
          <h2 id={`${copy.id}-titulo`} className="releva-section-title mt-2 sm:mt-3">
            {copy.heading}
          </h2>
          <p className="mt-3 hidden text-[16px] leading-7 text-public-muted sm:mt-4 sm:block">{copy.intro}</p>
        </div>

        <ul className="mt-5 grid grid-cols-3 gap-2 lg:hidden">
          {copy.columns.map((column) => {
            const selected = column.id === role;
            const Icon = pathIcons[column.id];
            return (
              <li key={column.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={column.role}
                  onClick={() => {
                    setHint(false);
                    onSelect(column.id);
                  }}
                  className={`flex min-h-[5.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-3 text-center ${
                    selected ? "bg-public-ink text-white" : "bg-public-card text-public-ink shadow-public"
                  }`}
                >
                  <span
                    className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      selected ? "bg-white/15 text-white" : "bg-public-sand text-public-clay"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-[13px] font-medium tracking-tight sm:text-sm">{column.role}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="releva-path-grid relative mt-6 hidden sm:mt-10 lg:block">
          {hint ? <PathPointer /> : null}
          <div className="grid grid-cols-3 gap-4">
          {copy.columns.map((column) => {
            const selected = column.id === role;
            return (
              <article
                key={column.id}
                className={`relative flex flex-col rounded-[1.75rem] p-2 shadow-public transition duration-300 ${selected ? "bg-public-ink text-white" : "releva-path-wait bg-public-card text-public-ink hover:-translate-y-1"}`}
              >
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setHint(false);
                    onSelect(column.id);
                  }}
                  className="flex flex-1 flex-col rounded-[1.35rem] px-6 py-7 pr-16 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
                >
                  <span className={selected ? "releva-path-mark releva-path-mark-on" : "releva-path-mark"} aria-hidden="true">
                    <span />
                  </span>
                  <h3 className="text-4xl font-medium tracking-tight">{column.role}</h3>
                  <p className={`mt-3 text-[16px] leading-7 ${selected ? "text-white/80" : "text-public-muted"}`}>{column.body}</p>
                </button>
                <Link
                  href={column.href}
                  className={`mx-auto mb-6 inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full px-5 text-sm ${selected ? "bg-white text-public-ink hover:bg-public-sand" : "bg-relify-btn text-white hover:bg-relify-btn-hover"}`}
                >
                  {column.cta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
