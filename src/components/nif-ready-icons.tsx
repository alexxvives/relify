/** Animated icons for the "Hemos rellenado la información inicial" modal. Motion lives in globals.css and stops under prefers-reduced-motion. */

export function FilledCheckIcon({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <span
      className="releva-row-check flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0f766e] text-white"
      style={{ animationDelay: `${delayMs}ms` }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path className="releva-row-check-path" d="M5 12.5l4.5 4.5L19 7.5" style={{ animationDelay: `${delayMs + 180}ms` }} />
      </svg>
    </span>
  );
}

/** A clock whose hand sweeps while a ring fills: "en 24 h" at a glance. */
export function WaitClockIcon() {
  return (
    <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1c2740] text-white" aria-hidden>
      <svg viewBox="0 0 32 32" className="absolute inset-0 size-10 -rotate-90">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="#2fc4b2" strokeOpacity="0.25" strokeWidth="3" />
        <circle className="releva-clock-ring" cx="16" cy="16" r="14.5" fill="none" stroke="#2fc4b2" strokeWidth="3" strokeLinecap="round" pathLength={100} />
      </svg>
      <svg viewBox="0 0 24 24" className="relative size-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <line className="releva-clock-hour" x1="12" y1="12" x2="12" y2="8" />
        <line className="releva-clock-minute" x1="12" y1="12" x2="12" y2="5.5" />
      </svg>
    </span>
  );
}
