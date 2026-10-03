"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { caseStudies, landingCopy } from "@/lib/landing-copy";

export function Cases() {
  const scroller = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    scroller.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  }

  return (
    <section id={landingCopy.cases.id} className="scroll-mt-24 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-[32px] leading-[1.05] font-normal tracking-[-0.02em] sm:text-[40px]">{landingCopy.cases.heading}</h2>
            <p className="mt-3 text-[15px] text-[#5c6b78]">{landingCopy.cases.intro}</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" aria-label="Anterior" onClick={() => move(-1)} className="inline-flex size-11 items-center justify-center rounded-full bg-[#eef1f4]">
              <ArrowLeft className="size-4" />
            </button>
            <button type="button" aria-label="Siguiente" onClick={() => move(1)} className="inline-flex size-11 items-center justify-center rounded-full bg-[#eef1f4]">
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
        <div ref={scroller} className="mt-8 flex snap-x gap-4 overflow-x-auto pb-2">
          {caseStudies.map((item) => (
            <article key={item.summary} className="w-[300px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_-24px_rgba(43,59,74,0.6)] ring-1 ring-black/5">
              <Image src={item.image} alt="" width={300} height={112} className="h-28 w-full object-cover" />
              <div className="p-4">
                <Link href="/proyectos" className="text-sm text-[#465ab4]">
                  {landingCopy.cases.similar}
                </Link>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[11px] text-[#7b8792]">{landingCopy.cases.closeLabel}</dt>
                    <dd className="font-medium">{item.days}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#7b8792]">{landingCopy.cases.dateLabel}</dt>
                    <dd className="font-medium">{item.date}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#7b8792]">{landingCopy.cases.revenueLabel}</dt>
                    <dd className="font-medium">{item.revenue}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#7b8792]">{landingCopy.cases.ebitdaLabel}</dt>
                    <dd className="font-medium">{item.ebitda}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm leading-6 text-[#3e4d5c]">{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
        <Link href="/recursos/casos" className="mt-4 inline-flex text-sm text-[#465ab4] sm:hidden">
          {landingCopy.cases.all}
        </Link>
      </div>
    </section>
  );
}
