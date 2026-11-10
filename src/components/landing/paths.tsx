"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, MousePointer2 } from "lucide-react";
import { landingCopy, type FlowRole } from "@/lib/landing-copy";

const pointerStops = [16, 50, 84];

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

export function Paths({ role, onSelect }: { role: FlowRole; onSelect: (role: FlowRole) => void }) {
  const copy = landingCopy.home.paths;
  const [hint, setHint] = useState(true);

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-24 px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-[1440px]">
        <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{copy.kicker}</p>
        <h2 id={`${copy.id}-titulo`} className="releva-section-title mt-2 max-w-3xl sm:mt-3">
          {copy.heading}
        </h2>
        <p className="mt-3 hidden text-[16px] leading-7 text-public-muted sm:mt-4 sm:block">{copy.intro}</p>
        <div className="releva-path-grid relative mt-6 sm:mt-10">
          {hint ? <PathPointer /> : null}
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:snap-none lg:grid-cols-3 lg:gap-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {copy.columns.map((column) => {
            const selected = column.id === role;
            return (
              <article
                key={column.id}
                className={`relative flex w-[min(18.75rem,calc(100vw-2.75rem))] shrink-0 snap-start flex-col rounded-[1.5rem] p-2 shadow-public transition duration-300 lg:w-auto lg:rounded-[1.75rem] ${selected ? "bg-public-ink text-white" : "releva-path-wait bg-public-card text-public-ink hover:-translate-y-1"}`}
              >
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setHint(false);
                    onSelect(column.id);
                  }}
                  className="flex flex-1 flex-col rounded-[1.35rem] px-5 py-5 pr-14 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay sm:px-6 sm:py-7 sm:pr-16"
                >
                  <span className={selected ? "releva-path-mark releva-path-mark-on" : "releva-path-mark"} aria-hidden="true">
                    <span />
                  </span>
                  <h3 className="text-[1.75rem] font-medium tracking-tight sm:text-4xl">{column.role}</h3>
                  <p className={`mt-3 hidden text-[16px] leading-7 sm:block ${selected ? "text-white/80" : "text-public-muted"}`}>{column.body}</p>
                  <ul className="mt-6 hidden flex-wrap gap-2 sm:flex">
                    {column.points.slice(0, 2).map((point) => (
                      <li
                        key={point}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${selected ? "bg-white/15 text-white" : "bg-public-sand text-public-ink"}`}
                      >
                        <Check className="size-3.5 shrink-0" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </button>
                <Link
                  href={column.href}
                  className={`mx-3 mb-4 inline-flex h-12 w-[calc(100%-1.5rem)] items-center justify-center gap-2 self-center rounded-full px-5 text-sm sm:mx-auto sm:mb-6 sm:w-fit ${selected ? "bg-white text-public-ink hover:bg-public-sand" : "bg-public-clay text-white hover:bg-public-clay-deep"}`}
                >
                  {column.cta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
