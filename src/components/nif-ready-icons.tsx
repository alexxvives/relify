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

/**
 * "en 24 h" at a glance: a ring fills while the minute hand makes one turn, then fades and starts again.
 * One SVG, hands pivot on the true centre (20,20) of the view box, so nothing wobbles or clips.
 */
export function WaitClockIcon() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#1c2740" />
      <circle cx="20" cy="20" r="16.5" fill="none" stroke="#2fc4b2" strokeOpacity="0.22" strokeWidth="2.5" />
      <circle
        className="releva-clock-ring"
        cx="20"
        cy="20"
        r="16.5"
        fill="none"
        stroke="#2fc4b2"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        transform="rotate(-90 20 20)"
      />
      <circle cx="20" cy="20" r="9.5" fill="none" stroke="#ffffff" strokeWidth="2" />
      <g className="releva-clock-hand releva-clock-hour">
        <line x1="20" y1="20" x2="20" y2="15" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      <g className="releva-clock-hand releva-clock-minute">
        <line x1="20" y1="20" x2="20" y2="12.5" stroke="#2fc4b2" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <circle cx="20" cy="20" r="1.6" fill="#ffffff" />
    </svg>
  );
}
