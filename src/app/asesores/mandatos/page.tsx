import type { Metadata } from "next";
import { MiniFicha, Scene, ScenePage, Trio } from "@/components/landing/scenes";

const title = "El mandato entra con las mismas reglas que una empresa";
const description = "La ficha del mandato enseña ciudad, precio y cifras. El cliente no tiene nombre ahí.";

export const metadata: Metadata = { title: "Trae un mandato", description, robots: { index: false, follow: false } };

export default function MandatosPublicPage() {
  return (
    <ScenePage
      eyebrow="Asesores"
      title={title}
      lead={description}
      cta={{ href: "/lista-de-espera", label: "Apuntarme como asesor" }}
      close="El asesor no publica la razón social para adelantar la operación."
    >
      <Scene label="La ficha del mandato">
        <div className="max-w-sm">
          <MiniFicha name="Mandato Alba" region="Valencia" />
        </div>
      </Scene>
      <Scene label="Tu sitio">
        <ul className="grid gap-3">
          {[
            ["Valencia", "En curso"],
            ["Sevilla", "En revisión"],
            ["Alicante", "Publicado"],
          ].map(([city, state]) => (
            <li key={city} className="flex items-center justify-between rounded-[1.2rem] bg-[#f4f1ea] px-5 py-4">
              <span className="text-lg">{city}</span>
              <span className="text-sm text-public-muted">{state}</span>
            </li>
          ))}
        </ul>
      </Scene>
      <Scene label="El comprador">
        <Trio
          items={[
            { title: "Acceso", body: "Pide conectar con el mandato." },
            { title: "Aceptación", body: "Tú decides si sigue." },
            { title: "Acuerdo", body: "La sociedad se abre al firmar.", live: true },
          ]}
        />
      </Scene>
    </ScenePage>
  );
}
