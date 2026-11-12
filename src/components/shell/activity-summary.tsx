import { Briefcase, FileSignature, Send, ShieldCheck } from "lucide-react";
import { ActivityTiles, share } from "@/components/shell/activity-tiles";
import { reachedQa } from "@/lib/advisor-hint";
import type { DealStep } from "@/lib/deal-pipeline";
import { sellerCopy } from "@/lib/seller-copy";
import type { InvestorFunnel } from "@/lib/server/activity-funnel";

type Tiles = Parameters<typeof ActivityTiles>[0]["tiles"];

/** t91: one card design for "Resumen de tu actividad", shared by the seller and buyer Inicio. */
export function ActivitySummaryCard({ intro, tiles, className = "" }: { intro: string; tiles: Tiles; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#e6e9f0] bg-white p-5 ${className}`}>
      <h2 className="text-lg font-semibold">{sellerCopy.activitySummary}</h2>
      <p className="mt-1 text-sm text-[#667085]">{intro}</p>
      <ActivityTiles tiles={tiles} />
    </section>
  );
}

/** Buyer funnel: the same metrics buyer "Mis procesos" used to show, now on Inicio only. */
export function BuyerActivitySummary({
  funnel,
  processes,
  className,
}: {
  funnel: InvestorFunnel;
  processes: { closed: unknown; steps: DealStep[] }[];
  className?: string;
}) {
  const closed = processes.filter((item) => item.closed !== null).length;
  const active = processes.length - closed;
  const pastNda = processes.filter((item) => reachedQa(item.steps)).length;
  return (
    <ActivitySummaryCard
      className={className}
      intro="Cómo avanzan tus búsquedas: de la solicitud a la oferta."
      tiles={[
        { label: "Solicitudes enviadas", value: funnel.requests, icon: Send, tone: "sky", ratio: funnel.requests > 0 ? 1 : 0, caption: "Peticiones de acceso" },
        { label: "Procesos activos", value: active, icon: Briefcase, tone: "indigo", ratio: share(active, funnel.requests), caption: closed > 0 ? `${closed} ${closed === 1 ? "cerrado" : "cerrados"}` : `${active} de ${funnel.requests} aceptadas` },
        { label: "NDAs firmados", value: funnel.ndas, icon: ShieldCheck, tone: "emerald", ratio: share(funnel.ndas, funnel.requests), caption: `${funnel.ndas} de ${funnel.requests} ${funnel.requests === 1 ? "solicitud" : "solicitudes"}` },
        { label: "Preguntas y LOIs", value: pastNda, icon: FileSignature, tone: "orange", ratio: share(pastNda, funnel.ndas), caption: `${pastNda} de ${funnel.ndas} con NDA` },
      ]}
    />
  );
}
