import { CalendarDays, Eye, FileSignature, ShieldCheck, UserPlus } from "lucide-react";
import { ActivityTiles, share } from "@/components/activity-tiles";
import { sellerCopy } from "@/lib/seller-copy";
import type { SellerFunnel } from "@/server/activityFunnel";

// "Resumen de tu actividad": the same funnel cards on Inicio and on Mis procesos.
export function SellerActivitySummary({ funnel, className = "" }: { funnel: SellerFunnel; className?: string }) {
  const percent = (part: number, whole: number) => `${Math.round(share(part, whole) * 100)} %`;

  return (
    <section className={`rounded-2xl border border-[#e6e9f0] bg-white p-5 ${className}`}>
      <h2 className="text-lg font-semibold">{sellerCopy.activitySummary}</h2>
      <p className="mt-1 text-sm text-[#667085]">{sellerCopy.activitySummaryIntro}</p>
      <ActivityTiles
        columns="md:grid-cols-3 xl:grid-cols-5"
        tiles={[
          { label: "Visitas a la ficha", value: funnel.views, icon: Eye, tone: "indigo", ratio: funnel.views > 0 ? 1 : 0, caption: "Compradores distintos" },
          { label: "Solicitudes", value: funnel.requests, icon: UserPlus, tone: "sky", ratio: share(funnel.requests, funnel.views), caption: funnel.views > 0 ? `${percent(funnel.requests, funnel.views)} de las visitas` : "Piden acceso a tu empresa" },
          { label: "NDAs firmados", value: funnel.ndas, icon: ShieldCheck, tone: "emerald", ratio: share(funnel.ndas, funnel.requests), caption: `${funnel.ndas} de ${funnel.requests} ${funnel.requests === 1 ? "solicitud" : "solicitudes"}` },
          { label: "LOIs recibidas", value: funnel.lois, icon: FileSignature, tone: "amber", ratio: share(funnel.lois, funnel.ndas), caption: `${funnel.lois} de ${funnel.ndas} con NDA` },
          { label: "Días publicado", value: funnel.daysListed ?? 0, icon: CalendarDays, tone: "orange", ratio: share(funnel.daysListed ?? 0, 180), caption: funnel.daysListed === null ? "Aún no publicada" : "Lo habitual: de 6 a 12 meses" },
        ]}
      />
    </section>
  );
}
