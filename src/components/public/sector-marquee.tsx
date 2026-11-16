"use client";

import { useEffect, useRef, useState } from "react";

/** One row of sector chips; when they overflow they scroll sideways (same marquee as the asesor cards). */
export function SectorMarquee({ sectors, className = "" }: { sectors: string[]; className?: string }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const row = rowRef.current;
    if (!box || !row) {
      return;
    }
    const measure = () => setOverflow(row.scrollWidth > box.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [sectors]);

  return (
    <span
      ref={boxRef}
      className={`releva-tag-marquee flex min-h-6 overflow-hidden ${className}`}
      title={sectors.join(" · ")}
      data-overflow={overflow || undefined}
    >
      <span className="releva-tag-track flex w-max">
        <span ref={rowRef} className="flex">
          <Chips sectors={sectors} />
        </span>
        {overflow ? <Chips sectors={sectors} hidden /> : null}
      </span>
    </span>
  );
}

function Chips({ sectors, hidden = false }: { sectors: string[]; hidden?: boolean }) {
  return (
    <span className="flex gap-1.5 pr-1.5" aria-hidden={hidden || undefined}>
      {sectors.map((sector) => (
        <span
          key={sector}
          className="shrink-0 rounded-full border border-[#dfe4f5] bg-white px-2.5 py-1 text-xs font-medium whitespace-nowrap text-[#1c2740]"
        >
          {sector}
        </span>
      ))}
    </span>
  );
}
