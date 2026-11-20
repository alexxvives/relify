"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Close = { id: string; codename: string; closedLabel: string; services: string; clientLabel: string };

/**
 * S33 (Alex): Operaciones cerradas en Relify. Each card opens its encargo; the row scrolls sideways with arrows once the
 * cards no longer fit.
 */
export function ClosedDealsSlider({ closes }: { closes: Close[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const update = () => {
      setEdges({ left: node.scrollLeft > 4, right: node.scrollLeft + node.clientWidth < node.scrollWidth - 4 });
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const move = (direction: 1 | -1) => {
    const node = rail.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.9, behavior: "smooth" });
  };
  const arrow =
    "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e6e9f0] bg-white text-[#1c2740] transition hover:bg-[#f5f6f8] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:cursor-default disabled:opacity-40";

  return (
    <div className="mt-5">
      {edges.left || edges.right ? (
        <div className="mb-3 flex justify-end gap-2">
          <button type="button" className={arrow} onClick={() => move(-1)} disabled={!edges.left} aria-label="Operaciones anteriores">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" className={arrow} onClick={() => move(1)} disabled={!edges.right} aria-label="Más operaciones">
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
      <ul ref={rail} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]" data-closed-deals>
        {closes.map((close) => (
          <li key={close.id} className="w-[min(18rem,80vw)] shrink-0 snap-start">
            <Link
              href={`/mandatos/encargos/${close.id}`}
              className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#e7eaee] bg-white transition hover:border-[#c9d2f5] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
            >
              <div className="bg-[#1c2740] px-5 pt-5 pb-6">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <p className="font-semibold text-white/55">Cerrada</p>
                  <p className="text-white/80">{close.closedLabel}</p>
                </div>
                <h3 className="mt-2 text-2xl leading-tight font-semibold tracking-tight break-words text-white">{close.codename}</h3>
              </div>
              <div className="flex flex-col gap-2 px-5 py-4">
                <p className="text-sm font-medium text-[#1c2740]">{close.clientLabel}</p>
                {close.services.length > 0 ? <p className="text-sm text-[#3d4a63]">{close.services}</p> : null}
                <p className="mt-auto pt-1 text-sm font-semibold text-[#465ab4]">Ver operación</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
