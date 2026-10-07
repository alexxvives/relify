"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  ClipboardList,
  Droplets,
  Factory,
  Globe,
  GraduationCap,
  HardHat,
  HeartPulse,
  House,
  Landmark,
  Monitor,
  Mountain,
  Palette,
  Store,
  Truck,
  Utensils,
  Wheat,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IndustrySector } from "@/lib/cnae-section";
import { layoutTreemap } from "@/lib/treemap";

const sectorIcons: Record<string, LucideIcon> = {
  A: Wheat,
  B: Mountain,
  C: Factory,
  D: Zap,
  E: Droplets,
  F: HardHat,
  G: Store,
  H: Truck,
  I: Utensils,
  J: Monitor,
  K: Landmark,
  L: Building2,
  M: Briefcase,
  N: ClipboardList,
  O: Landmark,
  P: GraduationCap,
  Q: HeartPulse,
  R: Palette,
  S: Wrench,
  T: House,
  U: Globe,
};

const hues = ["#465ab4", "#17663a", "#c47a12", "#7c5cbf"];
const frame = { width: 640, height: 320 };

function tileFill(index: number): string {
  const hue = hues[index] ?? "#5c6b78";
  return `color-mix(in oklab, ${hue} 34%, white)`;
}

function companyCount(value: number): string {
  return value === 1 ? "1 empresa" : `${value} empresas`;
}

export function IndustryTreemap({
  sectors,
  empty,
}: {
  sectors: IndustrySector[];
  empty: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const tiles = layoutTreemap(
    sectors.map((sector) => ({ id: sector.id, label: sector.label, value: sector.count })),
    frame.width,
    frame.height,
  );
  const total = tiles.reduce((sum, tile) => sum + tile.value, 0);
  const activeTile = tiles.find((tile) => tile.id === active) ?? null;

  if (tiles.length === 0) {
    return <p className="mt-4 text-sm text-[#667085]">{empty}</p>;
  }

  return (
    <div
      className="relative mt-4 h-80 overflow-hidden rounded-xl bg-[#f7f8fb]"
      onMouseLeave={() => {
        setActive(null);
      }}
    >
      {tiles.map((tile, index) => {
        const share = total === 0 ? 0 : Math.round((tile.value / total) * 100);
        const wide = tile.width > 120;
        const tall = tile.height > 72;
        const Icon = sectorIcons[tile.id] ?? Building2;
        return (
          <button
            key={tile.id}
            type="button"
            aria-label={`${tile.label}: ${companyCount(tile.value)}, ${share} % del total`}
            onMouseEnter={() => {
              setActive(tile.id);
            }}
            onFocus={() => {
              setActive(tile.id);
            }}
            onBlur={() => {
              setActive(null);
            }}
            className="absolute flex flex-col items-start justify-start overflow-hidden rounded-md px-2 py-1.5 text-left text-[#1c2740] transition"
            style={{
              left: `calc(${(tile.x / frame.width) * 100}% + 1px)`,
              top: `calc(${(tile.y / frame.height) * 100}% + 1px)`,
              width: `calc(${(tile.width / frame.width) * 100}% - 2px)`,
              height: `calc(${(tile.height / frame.height) * 100}% - 2px)`,
              background: tileFill(index),
              opacity: active !== null && active !== tile.id ? 0.45 : 1,
              boxShadow: active === tile.id ? "inset 0 0 0 2px #1c2740" : undefined,
            }}
          >
            <span className="inline-flex max-w-full items-center gap-1.5">
              <Icon className="size-4 shrink-0" aria-hidden />
              {wide && tall ? <span className="truncate text-sm font-medium">{tile.label}</span> : null}
            </span>
            {wide && tile.height > 96 ? (
              <span className="max-w-full truncate text-xs text-[#1c2740]/70 tabular-nums">{companyCount(tile.value)}</span>
            ) : null}
          </button>
        );
      })}
      {activeTile ? (
        <div
          className="pointer-events-none absolute z-10 grid min-w-40 gap-0.5 rounded-2xl border border-[#e7eaee] bg-white px-3 py-2.5 text-sm shadow-lg"
          style={{
            left: `min(${((activeTile.x + activeTile.width) / frame.width) * 100}%, calc(100% - 11rem))`,
            top: `min(${(activeTile.y / frame.height) * 100 + 8}%, calc(100% - 4.5rem))`,
          }}
        >
          <p className="font-medium text-[#1c2740]">{activeTile.label}</p>
          <p className="text-[#667085] tabular-nums">
            {companyCount(activeTile.value)} · {total === 0 ? "0" : Math.round((activeTile.value / total) * 100)} % del total
          </p>
        </div>
      ) : null}
    </div>
  );
}
