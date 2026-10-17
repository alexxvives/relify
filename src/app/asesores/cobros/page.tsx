import type { Metadata } from "next";
import { Scene, ScenePage } from "@/components/landing/scenes";

const title = "Cobras cuando el trabajo ya está encargado";
const description = "El depósito es 50 € más el 0,5 % del precio de venta, y es reembolsable.";

export const metadata: Metadata = { title: "Cómo cobras", description, robots: { index: false, follow: false } };

export default function CobrosPage() {
  return (
    <ScenePage
      eyebrow="Asesores"
      title={title}
      lead={description}
      cta={{ href: "/asesores/servicios", label: "Ver un encargo" }}
      close="Releva no cobra al pedir el presupuesto."
    >
      <Scene label="El depósito">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <p className="text-center text-6xl tracking-tight sm:text-7xl">50 € + 0,5 %</p>
          <p className="text-xl leading-8 text-public-muted">Sobre el precio de venta. Reembolsable. Esta página no abre una pasarela.</p>
        </div>
      </Scene>
      <Scene label="El encargo">
        <article className="max-w-lg rounded-[1.4rem] border border-public-line p-6">
          <p className="text-2xl tracking-tight">Proyecto Alba</p>
          <p className="mt-1 text-public-muted">Due diligence</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <p className="rounded-2xl bg-[#f4f1ea] px-4 py-4 text-sm">Pendiente de depósito</p>
            <p className="rounded-2xl bg-public-ink px-4 py-4 text-sm text-white">En curso</p>
          </div>
        </article>
      </Scene>
      <Scene label="Lo que no es una cuota">
        <ul className="grid gap-3">
          {["No hay suscripción de asesor.", "No hay comisión en esta página.", "El cierre de la operación se acuerda fuera."].map((line) => (
            <li key={line} className="rounded-[1.2rem] bg-[#f4f1ea] px-5 py-4 text-lg">
              {line}
            </li>
          ))}
        </ul>
      </Scene>
    </ScenePage>
  );
}
