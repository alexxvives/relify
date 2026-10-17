import type { Metadata } from "next";
import Link from "next/link";
import { Scene, ScenePage } from "@/components/landing/scenes";

const title = "Leer es gratis. Avanzar tiene un plan.";
const description = "Buscar y leer la ficha pública no cuesta. El contacto vive en el plan de pago.";

export const metadata: Metadata = { title: "Qué cuesta", description, robots: { index: false, follow: false } };

export default function PlanesPage() {
  return (
    <ScenePage
      eyebrow="Inversores"
      title={title}
      lead={description}
      cta={{ href: "/premium", label: "Ver los planes" }}
      close="Mientras el cobro no esté abierto, el siguiente paso es la lista de espera."
    >
      <Scene label="Gratis">
        <ul className="grid gap-3 md:grid-cols-3">
          {["Buscar", "Guardar", "Leer la ficha pública"].map((item) => (
            <li key={item} className="rounded-[1.4rem] bg-[#f4f1ea] px-5 py-10 text-2xl tracking-tight">
              {item}
            </li>
          ))}
        </ul>
      </Scene>
      <Scene label="De pago">
        <div className="grid items-end gap-6 md:grid-cols-[auto_1fr]">
          <p className="text-6xl tracking-tight">
            39 €<span className="ml-2 text-lg text-public-muted">/ mes</span>
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {["Contacto con la operación", "Seguimiento del proceso"].map((item) => (
              <li key={item} className="rounded-[1.2rem] bg-public-ink px-5 py-6 text-lg text-white">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Scene>
      <Scene label="Qué no se cobra aquí">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
          {["Depósito de un asesor", "Cierre de una operación"].map((item) => (
            <p key={item} className="rounded-[1.2rem] border border-public-line px-5 py-6 text-lg">
              {item}
            </p>
          ))}
          <Link href="/lista-de-espera" className="inline-flex h-12 items-center justify-center rounded-full bg-public-clay px-6 text-white">
            Lista de espera
          </Link>
        </div>
      </Scene>
    </ScenePage>
  );
}
