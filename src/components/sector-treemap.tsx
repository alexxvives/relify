"use client";

import { Treemap, type TreemapNode } from "@/components/arc/treemap/treemap";
import "@/components/arc/foundation.css";
import type { IndustrySector } from "@/lib/cnae-section";
import { formatWholeEur } from "@/lib/money";

function sectorTree(sectors: IndustrySector[]): TreemapNode {
  return {
    id: "sectores",
    label: "Sectores en venta",
    children: sectors.map((sector) => ({
      id: sector.id,
      label: sector.label,
      children: (sector.companies ?? []).map((company) => ({
        id: company.slug,
        label: company.codename,
        value: company.revenueCents,
      })),
    })),
  };
}

export function SectorTreemap({ sectors, empty }: { sectors: IndustrySector[]; empty: string }) {
  return (
    <div className="arc-scope mt-4">
      <Treemap data={sectorTree(sectors)} label="Facturación" formatValue={formatWholeEur} emptyLabel={empty} height={420} />
    </div>
  );
}
