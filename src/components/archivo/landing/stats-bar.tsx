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
    <div className="px-3 text-center">
      <p className="text-[36px] font-medium tracking-[-0.03em] text-[#465ab4] sm:text-[42px]">
        {current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
      </p>
      <p className="mx-auto mt-1 max-w-[180px] text-[13px] leading-5 text-[#5c6b78]">{label}</p>
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
    <div ref={ref} className="px-4 pt-4">
      <div className="mx-auto grid max-w-[1440px] gap-8 rounded-[28px] bg-[#f3f5f8] px-4 py-8 sm:grid-cols-2 lg:grid-cols-5 lg:py-10">
        {landingCopy.stats.map((stat) => (
          <Stat key={stat.label} value={stat.value} label={stat.label} active={active} />
        ))}
      </div>
    </div>
  );
}
