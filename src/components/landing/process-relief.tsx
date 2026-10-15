import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy } from "@/lib/landing-copy";

const pins = [
  { id: "madrid", x: 168, y: 168, label: "Madrid" },
  { id: "barcelona", x: 430, y: 132, label: "Barcelona" },
  { id: "valencia", x: 392, y: 248, label: "Valencia" },
  { id: "sevilla", x: 210, y: 286, label: "Sevilla" },
] as const;

function Building({ x, y, w, h, deep }: { x: number; y: number; w: number; h: number; deep: number }) {
  const top = `${x},${y - h} ${x + w},${y - h - deep * 0.35} ${x + w + deep},${y - h} ${x + deep},${y - h + deep * 0.35}`;
  const left = `${x},${y - h} ${x},${y} ${x + deep},${y + deep * 0.35} ${x + deep},${y - h + deep * 0.35}`;
  const right = `${x + deep},${y - h + deep * 0.35} ${x + deep},${y + deep * 0.35} ${x + w + deep},${y} ${x + w + deep},${y - h}`;

  return (
    <g>
      <polygon points={left} fill="#0e6d72" />
      <polygon points={right} fill="#14959a" />
      <polygon points={top} fill="#d7f7f3" />
    </g>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <polygon points={`${x},${y} ${x - 10},${y + 16} ${x + 10},${y + 16}`} fill="#0b5c55" />
      <polygon points={`${x},${y - 12} ${x - 8},${y + 4} ${x + 8},${y + 4}`} fill="#12867a" />
    </g>
  );
}

export function ProcessRelief() {
  const copy = landingCopy.home.process;

  return (
    <section aria-labelledby="vender-relieve-titulo" className="scroll-mt-28 px-5 pb-12 sm:px-8 sm:pb-16">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12">
        <div>
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{copy.kicker}</p>
          <h2 id="vender-relieve-titulo" className="mt-3 text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">
            {copy.heading}
            <span className="mt-2 block text-public-clay">{copy.accent}</span>
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-public-muted">{copy.body}</p>
          <Link
            href="/empresas/vender"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white transition hover:bg-public-clay-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
          >
            {copy.cta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="releva-relief" aria-hidden="true">
          <svg viewBox="0 0 640 460" className="h-auto w-full">
            <defs>
              <linearGradient id="releva-relief-land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7ed0cb" />
                <stop offset="1" stopColor="#0f6e73" />
              </linearGradient>
              <filter id="releva-relief-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="18" stdDeviation="12" floodColor="#08343a" floodOpacity="0.28" />
              </filter>
            </defs>
            <ellipse cx="320" cy="250" rx="250" ry="150" fill="#0c4c52" opacity="0.35" />
            <g filter="url(#releva-relief-shadow)">
              <path
                d="M120 250 C150 150 250 110 340 120 C460 132 540 190 530 270 C518 360 400 400 280 386 C160 372 90 330 120 250Z"
                fill="url(#releva-relief-land)"
              />
              <path
                d="M180 248 C210 186 290 164 360 176 C450 192 500 236 488 286 C474 340 390 362 300 350 C210 338 150 310 180 248Z"
                fill="#8fe0d8"
                opacity="0.45"
              />
            </g>
            <path id="releva-relief-road" d="M168 210 C250 190 300 230 392 190 C450 168 470 210 430 250" fill="none" stroke="#e7fffc" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <Tree x={150} y={210} />
            <Tree x={196} y={300} />
            <Tree x={470} y={200} />
            <Tree x={500} y={280} />
            <Tree x={250} y={150} />
            <Building x={230} y={230} w={46} h={54} deep={22} />
            <Building x={300} y={250} w={34} h={78} deep={18} />
            <Building x={348} y={236} w={40} h={42} deep={16} />
            <Building x={410} y={268} w={28} h={36} deep={14} />
            <circle r="5" fill="#e7fffc">
              <animateMotion dur="8s" repeatCount="indefinite" rotate="0">
                <mpath href="#releva-relief-road" />
              </animateMotion>
            </circle>
            {pins.map((pin) => (
              <g key={pin.id} className="releva-relief-pin" style={{ transformOrigin: `${pin.x}px ${pin.y}px` }}>
                <path d={`M${pin.x} ${pin.y} c0-16 12-28 0-44 c-12 16 0 28 0 44z`} fill="#0b3d42" />
                <circle cx={pin.x} cy={pin.y - 34} r="7" fill="#e7fffc" />
                <text x={pin.x} y={pin.y + 18} textAnchor="middle" fill="#073238" fontSize="13" fontWeight="600">
                  {pin.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
