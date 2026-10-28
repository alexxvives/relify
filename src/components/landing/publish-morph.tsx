"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { TextMorph } from "@/components/arc/text-morph/text-morph";

const steps = ["lista para publicar", "publicada"] as const;

/** Hero chip on the Empresas landing: the ficha goes from "lista para publicar" to "publicada". Reduced motion shows the end state, still. */
export function PublishMorph() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % steps.length), index === 0 ? 2200 : 3800);
    return () => window.clearTimeout(timer);
  }, [index, reduced]);
  const done = reduced || index === 1;
  return (
    <p className="mt-2 flex items-center gap-1.5 border-t border-public-line pt-2 text-xs text-public-ink">
      <span aria-hidden="true" className={`size-2 rounded-full transition-colors duration-300 ${done ? "bg-public-clay" : "bg-[#c9a227]"}`} />
      <span>Ficha</span>
      <span aria-live="off"><TextMorph>{reduced ? steps[1] : steps[index]}</TextMorph></span>
    </p>
  );
}
