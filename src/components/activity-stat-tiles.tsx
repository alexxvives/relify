import type { LucideIcon } from "lucide-react";

export type ActivityStat = { label: string; value: number; icon: LucideIcon };

/** Palette from docs/DESIGN.md and the finance charts: indigo, orange, teal, green. */
const tones = [
  { bg: "bg-[#eef1fb]", ring: "ring-[#465ab4]/15", chip: "bg-[#465ab4]", ink: "text-[#2f3f8f]" },
  { bg: "bg-[#fdf1e8]", ring: "ring-[#e07a3e]/20", chip: "bg-[#e07a3e]", ink: "text-[#a4521f]" },
  { bg: "bg-[#e6f4f3]", ring: "ring-[#0c7c78]/15", chip: "bg-[#0c7c78]", ink: "text-[#0b5559]" },
  { bg: "bg-[#e7f6ee]", ring: "ring-[#1b7a45]/15", chip: "bg-[#1b7a45]", ink: "text-[#17663a]" },
];

export function ActivityStatTiles({ stats, className = "" }: { stats: ActivityStat[]; className?: string }) {
  return (
    <ul className={`grid gap-3 ${className}`}>
      {stats.map((item, index) => {
        const tone = tones[index % tones.length];
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
