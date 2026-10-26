import type { LucideIcon } from "lucide-react";

export type ActivityTile = {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Accent colour for the icon chip and the bar. */
  tone: "indigo" | "emerald" | "amber" | "sky";
  /** Bar fill 0..1. */
  ratio: number;
  /** Small caption under the bar, e.g. "3 de 5 procesos". */
  caption: string;
};

const tones = {
  indigo: { chip: "bg-[#eef0fb] text-[#465ab4]", bar: "bg-[#465ab4]" },
  emerald: { chip: "bg-[#e9f7f0] text-[#16805a]", bar: "bg-[#22a06b]" },
  amber: { chip: "bg-[#fdf4e3] text-[#b26b00]", bar: "bg-[#e3a008]" },
  sky: { chip: "bg-[#e8f4fb] text-[#1f6f9f]", bar: "bg-[#3b9fd6]" },
} as const;

export function ActivityTiles({ tiles }: { tiles: ActivityTile[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => {
        const tone = tones[tile.tone];
        const pct = Math.round(Math.max(0, Math.min(1, tile.ratio)) * 100);
        return (
          <li key={tile.label} className="flex flex-col rounded-2xl border border-[#e7eaee] bg-white p-4">
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
          </li>
        );
      })}
    </ul>
  );
}

export function share(part: number, whole: number): number {
  return whole > 0 ? Math.min(1, part / whole) : 0;
}
