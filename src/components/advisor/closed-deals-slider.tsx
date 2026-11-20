"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { advisorCopy } from "@/lib/advisor-copy";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Close = { id: string; codename: string; closedLabel: string; services: string; clientLabel: string; buyerLabel: string | null };

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
              {/* S35 (Alex): no Cerrada tag (implicit); the buyer appears when the advisor may know it. */}
              <div className="bg-[#1c2740] px-5 pt-4 pb-5">
                <p className="text-xs text-white/70">{close.closedLabel}</p>
                <h3 className="mt-1 text-xl leading-tight font-semibold tracking-tight break-words text-white">{close.codename}</h3>
              </div>
              <dl className="flex flex-1 flex-col gap-3 px-5 py-4 text-sm">
                <div>
                  <dt className="text-xs text-[#64748b]">{advisorCopy.closeBuyer}</dt>
                  <dd className="mt-0.5 font-medium break-words text-[#1c2740]">{close.buyerLabel ?? advisorCopy.closeBuyerHidden}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748b]">{advisorCopy.closeClient}</dt>
                  <dd className="mt-0.5 font-medium text-[#1c2740]">{close.clientLabel}</dd>
                </div>
                {close.services.length > 0 ? (
                  <div>
                    <dt className="text-xs text-[#64748b]">{advisorCopy.closeServices}</dt>
                    <dd className="mt-0.5 text-[#3d4a63]">{close.services}</dd>
                  </div>
                ) : null}
                <dd className="mt-auto inline-flex items-center gap-1 pt-1 font-semibold text-[#465ab4]">
                  {advisorCopy.closeOpen}
                  <ArrowRight className="size-4" aria-hidden />
                </dd>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
