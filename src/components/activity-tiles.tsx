import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type ActivityTile = {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Accent colour for the icon chip and the bar. */
  tone: "indigo" | "emerald" | "amber" | "sky" | "orange";
  /** Bar fill 0..1. */
  ratio: number;
  /** Small caption under the bar, e.g. "3 de 5 procesos". */
  caption: string;
  /** Optional: the whole card links here. */
  href?: string;
};

const tones = {
  indigo: { chip: "bg-[#eef0fb] text-[#465ab4]", bar: "bg-[#465ab4]" },
  emerald: { chip: "bg-[#e9f7f0] text-[#16805a]", bar: "bg-[#22a06b]" },
  amber: { chip: "bg-[#fdf4e3] text-[#b26b00]", bar: "bg-[#e3a008]" },
  sky: { chip: "bg-[#e8f4fb] text-[#1f6f9f]", bar: "bg-[#3b9fd6]" },
  orange: { chip: "bg-[#fdf1e8] text-[#c25e22]", bar: "bg-[#e07a3e]" },
} as const;

const cardClass = "flex w-full flex-col rounded-2xl border border-[#e7eaee] bg-white p-4";

function TileBody({ tile, tone, pct }: { tile: ActivityTile; tone: (typeof tones)[keyof typeof tones]; pct: number }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${tone.chip}`}>
          <tile.icon className="size-[18px]" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-xs font-medium leading-4 text-[#64748b]">{tile.label}</p>
        <p className="shrink-0 text-2xl font-semibold tabular-nums leading-none text-[#1f2a37]">{tile.value}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1f3f6]" role="presentation">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[11px] leading-4 text-[#8a94a6]">{tile.caption}</p>
    </>
  );
}

export function ActivityTiles({ tiles, columns = "lg:grid-cols-4" }: { tiles: ActivityTile[]; columns?: string }) {
  return (
    <ul className={`mt-4 grid grid-cols-2 gap-3 ${columns}`}>
      {tiles.map((tile) => {
        const tone = tones[tile.tone];
        const pct = Math.round(Math.max(0, Math.min(1, tile.ratio)) * 100);
        return (
          <li key={tile.label} className="flex">
            {tile.href ? (
              <Link href={tile.href} className={`${cardClass} transition duration-300 hover:-translate-y-0.5 hover:border-[#c9d2f5]`}>
                <TileBody tile={tile} tone={tone} pct={pct} />
              </Link>
            ) : (
              <div className={cardClass}>
                <TileBody tile={tile} tone={tone} pct={pct} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type ActivityStat = { label: string; value: number; icon: LucideIcon };

/** Inicio tiles: tinted cards cycling the DESIGN.md palette (indigo, orange, teal, green). */
const statTones = [
  { bg: "bg-[#eef1fb]", ring: "ring-[#465ab4]/15", chip: "bg-[#465ab4]", ink: "text-[#2f3f8f]" },
  { bg: "bg-[#fdf1e8]", ring: "ring-[#e07a3e]/20", chip: "bg-[#e07a3e]", ink: "text-[#a4521f]" },
  { bg: "bg-[#e6f4f3]", ring: "ring-[#0c7c78]/15", chip: "bg-[#0c7c78]", ink: "text-[#0b5559]" },
  { bg: "bg-[#e7f6ee]", ring: "ring-[#1b7a45]/15", chip: "bg-[#1b7a45]", ink: "text-[#17663a]" },
];

export function ActivityStatTiles({ stats, className = "" }: { stats: ActivityStat[]; className?: string }) {
  return (
    <ul className={`grid gap-3 ${className}`}>
      {stats.map((item, index) => {
        const tone = statTones[index % statTones.length];
        const Icon = item.icon;
        return (
          <li key={item.label} className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-4 ring-1 ${tone.bg} ${tone.ring}`}>
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${tone.chip}`}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className={`block text-2xl leading-7 font-semibold tabular-nums ${tone.ink}`}>{item.value}</span>
              <span className="block text-xs leading-4 text-[#3d4a63]">{item.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function share(part: number, whole: number): number {
  return whole > 0 ? Math.min(1, part / whole) : 0;
}
