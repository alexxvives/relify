"use client";

import { useEffect, useState } from "react";
import { dealStepIds, landingDealSteps } from "@/lib/deal-pipeline";
import { landingCopy } from "@/lib/landing-copy";

const dwell = 2400;

export function LandingPipeline() {
  const copy = landingCopy.home.flow.pipeline;
  const [active, setActive] = useState(0);
  const steps = landingDealSteps(active);
  const current = steps[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % dealStepIds.length);
    }, dwell);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="releva-land-pipe mt-10 sm:mt-14">
      <p className="text-center text-sm tracking-[0.16em] text-public-clay uppercase">{copy.kicker}</p>
      <h3 className="releva-section-title mt-2 text-center text-pretty sm:mt-3">{copy.heading}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[16px] leading-7 text-pretty text-public-muted sm:mt-4">{copy.intro}</p>
      <ol className="releva-land-pipe-track" aria-label={copy.heading}>
        {steps.map((step, index) => {
          const state = index === active ? "current" : index < active ? "done" : "upcoming";
          return (
            <li key={step.id} className={`releva-land-pipe-step releva-land-pipe-${state}`}>
              <button
                type="button"
                aria-current={index === active ? "step" : undefined}
                onClick={() => setActive(index)}
                className="releva-land-pipe-hit"
              >
                <span className="releva-land-pipe-dot" aria-hidden="true" />
                <span className="releva-land-pipe-label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {current ? (
        <article key={current.id} className="releva-land-pipe-callout">
          <p className="releva-land-pipe-kicker">Paso {active + 1}</p>
          <h4>{current.label}</h4>
          <p>{current.detail}</p>
        </article>
      ) : null}
    </div>
  );
}
