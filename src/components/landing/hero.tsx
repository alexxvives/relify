"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy } from "@/lib/landing-copy";
import { BuyerMark } from "@/components/landing/buyer-mark";

function BuyerSlip({
  person,
  tone,
  hidden = false,
}: {
  person: (typeof landingCopy.home.buyers)[number];
  tone: number;
  hidden?: boolean;
}) {
  return (
    <li className="releva-hero-slip" data-slip="" aria-hidden={hidden || undefined}>
      <span className="releva-hero-portrait">
        <BuyerMark tone={tone} />
      </span>
      <span className="min-w-0">
        <span className="releva-hero-who">{person.who}</span>
        <span className="releva-hero-city">{person.city}</span>
        <span className="releva-hero-seek">{person.seek}</span>
      </span>
      <span className="releva-hero-live" aria-hidden="true" />
    </li>
  );
}

function BuyerColumn() {
  const reelRef = useRef<HTMLUListElement>(null);
  const buyers = landingCopy.home.buyers;

  useEffect(() => {
    const reel = reelRef.current;
    const mask = reel?.parentElement;
    if (!reel || !mask) {
      return;
    }

    let y = 0;
    let frame = 0;
    const tick = () => {
      const half = reel.scrollHeight / 2;
      if (half > 0) {
        y = (y + 0.42) % half;
        reel.style.transform = `translateY(${-y}px)`;
      }
      const bounds = mask.getBoundingClientRect();
      const center = bounds.top + bounds.height * 0.46;
      const cards = reel.querySelectorAll<HTMLElement>("[data-slip]");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - center);
        const near = Math.max(0, 1 - distance / (bounds.height * 0.42));
        card.style.opacity = String(0.4 + near * 0.6);
        card.style.transform = `scale(${0.94 + near * 0.08})`;
        card.style.boxShadow = near > 0.62 ? "0 18px 34px -16px rgb(0 0 0 / 0.6), 0 0 0 2px #7ed0cb" : "none";
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="releva-hero-stage" aria-label={landingCopy.home.buyersKicker}>
      <p className="releva-hero-kicker">{landingCopy.home.buyersKicker}</p>
      <div className="releva-hero-mask">
        <ul ref={reelRef} className="releva-hero-reel">
          {buyers.map((person, index) => (
            <BuyerSlip key={person.id} person={person} tone={index} />
          ))}
          {buyers.map((person, index) => (
            <BuyerSlip key={`${person.id}-loop`} person={person} tone={index} hidden />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Hero() {
  const copy = landingCopy.home;

  return (
    <section aria-labelledby="inicio" className="releva-hero">
      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-16">
        <div>
          <h1 id="inicio" className="releva-hero-rise max-w-[14ch] text-[clamp(2.7rem,4.5vw,4.15rem)] leading-[1.02] font-medium tracking-tight text-public-ink">
            <span className="releva-word text-public-clay">Releva</span> tu negocio a la persona que ya lo está buscando
          </h1>
          <p className="releva-hero-rise releva-hero-rise-late mt-6 max-w-xl text-lg leading-8 text-public-muted">{copy.intro}</p>
          <Link
            href="/registro"
            className="releva-hero-rise releva-hero-rise-later mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white transition hover:bg-public-clay-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
          >
            {copy.cta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <BuyerColumn />
      </div>
    </section>
  );
}
