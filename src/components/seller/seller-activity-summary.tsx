import { CalendarDays, Eye, FileSignature, ShieldCheck, UserPlus } from "lucide-react";
import { share } from "@/components/shell/activity-tiles";
import { ActivitySummaryCard } from "@/components/shell/activity-summary";
import { sellerCopy } from "@/lib/seller-copy";
import type { SellerFunnel } from "@/lib/server/activity-funnel";

// "Resumen de tu actividad" for sellers; t91: shown on Inicio only.
export function SellerActivitySummary({ funnel, className = "" }: { funnel: SellerFunnel; className?: string }) {
  const percent = (part: number, whole: number) => `${Math.round(share(part, whole) * 100)} %`;

  return (
    <ActivitySummaryCard
      className={className}
      intro={sellerCopy.activitySummaryIntro}
      tiles={[
        { label: "Visitas", value: funnel.views, icon: Eye, tone: "indigo", ratio: funnel.views > 0 ? 1 : 0, caption: "Sin repetir" },
        { label: "Solicitudes", value: funnel.requests, icon: UserPlus, tone: "sky", ratio: share(funnel.requests, funnel.views), caption: funnel.views > 0 ? `${percent(funnel.requests, funnel.views)} de las visitas` : "Piden acceso" },
        { label: "NDAs firmados", value: funnel.ndas, icon: ShieldCheck, tone: "emerald", ratio: share(funnel.ndas, funnel.requests), caption: `${funnel.ndas} de ${funnel.requests} ${funnel.requests === 1 ? "solicitud" : "solicitudes"}` },
        { label: "LOIs recibidas", value: funnel.lois, icon: FileSignature, tone: "amber", ratio: share(funnel.lois, funnel.ndas), caption: `${funnel.lois} de ${funnel.ndas} con NDA` },
        { label: "Días en venta", value: funnel.daysListed ?? 0, icon: CalendarDays, tone: "orange", ratio: share(funnel.daysListed ?? 0, 180), caption: funnel.daysListed === null ? "Aún no publicada" : "Lo habitual: de 6 a 12 meses" },
      ]}
    />
  );
}
