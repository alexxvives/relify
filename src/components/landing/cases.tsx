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
    <section id={landingCopy.cases.id} className="scroll-mt-28 px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">{landingCopy.cases.heading}</h2>
            <p className="mt-4 text-[16px] leading-7 text-public-muted">{landingCopy.cases.intro}</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => move(-1)}
              className="inline-flex size-11 items-center justify-center rounded-full bg-public-card text-public-ink shadow-public"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => move(1)}
              className="inline-flex size-11 items-center justify-center rounded-full bg-public-card text-public-ink shadow-public"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
        <div ref={scroller} className="mt-8 flex snap-x gap-4 overflow-x-auto pb-2">
          {caseStudies.map((item) => (
            <article key={item.summary} className="w-[300px] shrink-0 snap-start overflow-hidden rounded-[2rem] bg-public-card shadow-public">
              <Image src={item.image} alt="" width={300} height={140} className="h-32 w-full object-cover" />
              <div className="p-5">
                <Link href="/proyectos" className="text-sm font-medium text-public-clay">
                  {landingCopy.cases.similar}
                </Link>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[11px] tracking-wide text-public-muted uppercase">{landingCopy.cases.closeLabel}</dt>
                    <dd className="font-medium text-public-clay">{item.days}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] tracking-wide text-public-muted uppercase">{landingCopy.cases.dateLabel}</dt>
                    <dd>{item.date}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] tracking-wide text-public-muted uppercase">{landingCopy.cases.revenueLabel}</dt>
                    <dd className="font-medium text-public-clay">{item.revenue}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] tracking-wide text-public-muted uppercase">{landingCopy.cases.ebitdaLabel}</dt>
                    <dd className="font-medium text-public-clay">{item.ebitda}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm leading-6 text-public-muted">{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
        <Link href="/recursos/casos" className="mt-4 inline-flex text-sm font-medium text-public-clay sm:hidden">
          {landingCopy.cases.all}
        </Link>
      </div>
    </section>
  );
}
