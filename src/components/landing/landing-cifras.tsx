"use client";

import CountUp from "@/components/landing/count-up";
import { useAllowsMotion } from "@/components/landing/landing-motion";
import { landingCopy, offerDeals } from "@/lib/landing-copy";
import { parseShowcaseMoney } from "@/lib/showcase-card";

const sample = offerDeals[0];

function thousandsFromShowcase(value: string): number {
  return Math.round(parseShowcaseMoney(value) / 100_000);
}

function Figure({ to, label }: { to: number; label: string }) {
  const motion = useAllowsMotion();

  return (
    <div className="rounded-2xl border border-[#dde7ea] bg-white px-5 py-4 text-center">
      <p className="text-xs font-semibold tracking-[0.14em] text-[#0f766e] uppercase">{label}</p>
      <p className="mt-2 min-h-[2rem] text-2xl font-semibold tabular-nums text-[#1c2740]">
        {motion ? <CountUp to={to} duration={1.1} suffix="K €" trigger="view" /> : <span>{`${to}K €`}</span>}
      </p>
    </div>
  );
}

export function LandingCifras() {
  const copy = landingCopy.home.v2;

  return (
    <section id={copy.cifrasId} aria-labelledby={`${copy.cifrasId}-titulo`} className="scroll-mt-24 px-5 pt-2 pb-6 sm:px-8 sm:pt-6 sm:pb-8">
      <div className="mx-auto w-full max-w-[1440px] rounded-[1.5rem] border border-[#dde7ea] bg-white/80 px-4 py-6 sm:rounded-[2rem] sm:px-8 sm:py-8">
        <p className="text-center text-sm font-semibold tracking-[0.16em] text-[#0f766e] uppercase">{copy.cifrasKicker}</p>
        <h2 id={`${copy.cifrasId}-titulo`} className="releva-section-title mt-2 text-center">
          {copy.cifrasHeading}
        </h2>
        <p className="mt-3 text-center text-[16px] leading-7 text-[#3d4a63]">{copy.cifrasIntro}</p>
        <p className="mt-2 text-center text-sm text-[#5c6b78]">
          {sample.codename} · {sample.region}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Figure to={thousandsFromShowcase(sample.revenue)} label={copy.revenue} />
          <Figure to={thousandsFromShowcase(sample.ebitda)} label={copy.ebitda} />
          <Figure to={thousandsFromShowcase(sample.price)} label={copy.price} />
        </div>
      </div>
    </section>
  );
}
