import { Card } from "@/components/ui/form";
import { RegistryBadge } from "@/components/registry-badge";
import { compactEur } from "@/lib/report-format";
import type { SabiRegistry } from "@/lib/sabi/registry";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e7eaee] bg-white p-3">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#1c2740] tabular-nums">{value}</p>
    </div>
  );
}

const money = (cents: number | null) => (cents === null ? "—" : compactEur(cents));

/**
 * t74: read-only snapshot of what the registry import (SABI) says about the seller's own company,
 * so /mi-empresa/detalles shows the same core data admin sees. Seller-only inputs stay in the form below.
 */
export function RegistrySummaryCard({ registry, legalName, cif }: { registry: SabiRegistry; legalName: string; cif: string }) {
  const latest = registry.years.at(-1);
  if (!latest) return null;
  const owners = registry.shareholdings.length;
  const directors = registry.directors.length;

  return (
    <Card id="panel-registry-summary" className="scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">Tu empresa según el registro</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">
            {legalName || "Tu empresa"}
            {cif ? ` · ${cif}` : ""} · último cierre {latest.year}. Estos datos se rellenan solos; tú solo completas descripción, motivo de venta, precio, ajustes de EBITDA e imagen.
          </p>
        </div>
        <RegistryBadge />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Stat label="Ingresos" value={money(latest.revenueCents)} />
        <Stat label="EBITDA" value={money(latest.ebitdaCents)} />
        <Stat label="Resultado neto" value={money(latest.netResultCents)} />
        <Stat label="Empleados" value={latest.employees === null ? "—" : String(latest.employees)} />
        <Stat label="Activo total" value={money(latest.totalAssetsCents)} />
        <Stat label="Patrimonio neto" value={money(latest.equityCents)} />
        <Stat label="Accionistas" value={String(owners)} />
        <Stat label="Administradores" value={String(directors)} />
      </div>
    </Card>
  );
}
