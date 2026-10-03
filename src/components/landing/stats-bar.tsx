"use client";

import { useEffect, useRef, useState } from "react";
import { landingCopy } from "@/lib/landing-copy";

function useCount(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const frame = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(frame);
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 1400);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

function Stat({ value, label, active }: { value: number; label: string; active: boolean }) {
  const current = useCount(value, active);
  return (
    <div className="px-2 py-3">
      <p className="text-3xl font-medium tracking-tight text-public-clay sm:text-4xl">
        {current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
      </p>
      <p className="mt-2 max-w-[200px] text-[13px] leading-5 text-public-muted">{label}</p>
    </div>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="px-5 pt-4 pb-8">
      <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-4 rounded-[2rem] bg-public-card p-6 shadow-public sm:grid-cols-3 lg:grid-cols-5">
        {landingCopy.stats.map((stat) => (
          <Stat key={stat.label} value={stat.value} label={stat.label} active={active} />
        ))}
      </dl>
    </div>
  );
}
