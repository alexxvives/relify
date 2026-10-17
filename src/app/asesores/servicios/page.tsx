import type { Metadata } from "next";
import { Scene, ScenePage, Trio } from "@/components/landing/scenes";
import { advisoryServices } from "@/lib/advisory";

const title = "Seis formas de entrar en una operación";
const description = "El inversor elige el servicio. El trabajo empieza cuando el depósito está pagado.";

export const metadata: Metadata = { title: "Servicios", description, robots: { index: false, follow: false } };

const verbs = ["Revisar", "Valorar", "Acompañar", "Ordenar", "Proyectar", "Alinear"] as const;

export default function ServiciosPublicPage() {
  return (
    <ScenePage
      eyebrow="Asesores"
      title={title}
      lead={description}
      cta={{ href: "/asesoramiento", label: "Ver servicios" }}
      close="Pedir un servicio no cobra a nadie en esta página."
    >
      <Scene label="La rejilla">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {advisoryServices.map((service, index) => (
            <li key={service.id} className="min-h-40 rounded-[1.4rem] bg-[#f4f1ea] px-5 py-5">
              <p className="text-sm tracking-[0.14em] text-public-clay uppercase">{verbs[index]}</p>
              <p className="mt-3 text-xl tracking-tight">{service.title}</p>
              <p className="mt-2 text-sm leading-6 text-public-muted">{service.body}</p>
            </li>
          ))}
        </ul>
      </Scene>
      <Scene label="Cómo se pide">
        <Trio
          items={[
            { title: "El inversor elige", body: "Marca el servicio sobre la operación." },
            { title: "El asesor ve el encargo", body: "Llega con la empresa aún anónima." },
            { title: "Empieza el trabajo", body: "Cuando el depósito está pagado.", live: true },
          ]}
        />
      </Scene>
      <Scene label="Dónde vive">
        <ol className="grid gap-3 md:grid-cols-4">
          {["Marketplace", "Encargo", "Chat", "Reuniones"].map((place, index) => (
            <li key={place} className="rounded-[1.2rem] border border-public-line px-4 py-6">
              <p className="text-xs text-public-muted">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-xl">{place}</p>
            </li>
          ))}
        </ol>
      </Scene>
    </ScenePage>
  );
}
