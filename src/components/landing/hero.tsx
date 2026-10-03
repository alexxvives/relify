"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DealCard } from "@/components/landing/deal-card";
import { heroDeals, landingCopy } from "@/lib/landing-copy";

function RotatingWord({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const widest = words.reduce((longest, word) => (word.length > longest.length ? word : longest), words[0]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % words.length);
        setVisible(true);
      }, 280);
    }, 2800);
    return () => window.clearInterval(id);
  }, [words.length]);

  return (
    <span className="inline-grid align-bottom" aria-live="polite">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">
        {widest}
      </span>
      <span
        className={`col-start-1 row-start-1 transition duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        {words[index]}
      </span>
    </span>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="inicio" className="px-5 pt-12 pb-6 sm:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 id="inicio" className="text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
          Plataforma digital para <RotatingWord words={landingCopy.words} /> empresas
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-public-muted">{landingCopy.intro}</p>
        <Link
          href="/registro"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white transition hover:bg-public-clay-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
        >
          {landingCopy.registerCta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="mx-auto mt-14 max-w-5xl rounded-[2rem] bg-public-card p-4 shadow-public sm:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {heroDeals.slice(0, 3).map((deal) => (
            <DealCard key={deal.codename} deal={deal} />
          ))}
        </div>
      </div>
    </section>
  );
}
