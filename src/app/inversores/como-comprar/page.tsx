import type { Metadata } from "next";
import { MiniFicha, Scene, ScenePage, Trio } from "@/components/landing/scenes";

const title = "Lees la empresa antes de saber quién es";
const description = "El catálogo abre región y cifras. La sociedad espera al acuerdo.";

export const metadata: Metadata = { title: "Cómo comprar", description, robots: { index: false, follow: false } };

export default function ComoComprarPage() {
  return (
    <ScenePage
      eyebrow="Inversores"
      title={title}
      lead={description}
      cta={{ href: "/mercado", label: "Ver empresas" }}
      close="El plan gratuito ya deja leer el catálogo."
    >
      <Scene label="El catálogo">
        <div className="grid gap-4 md:grid-cols-3">
          <MiniFicha name="Proyecto Alba" region="Valencia" />
          <MiniFicha name="Proyecto Nube" region="Madrid" price="1,1 M€" />
          <MiniFicha name="Proyecto Cala" region="Málaga" price="3,6 M€" />
        </div>
      </Scene>
      <Scene label="Pedir acceso">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="relative">
            <MiniFicha />
            <span className="absolute right-4 bottom-4 rounded-full bg-public-clay px-4 py-2 text-sm text-white">Conectar</span>
          </div>
          <Trio
            items={[
              { title: "En espera", body: "La solicitud está con el vendedor." },
              { title: "Aceptado", body: "Puedes firmar el acuerdo." },
              { title: "Acuerdo firmado", body: "Se abre la operación.", live: true },
            ]}
          />
        </div>
      </Scene>
      <Scene label="Lo que se abre">
        <Trio
          items={[
            { title: "Preguntas", body: "Cerrado hasta el acuerdo." },
            { title: "Reunión", body: "Cerrado hasta el acuerdo." },
            { title: "Oferta", body: "Cerrado hasta el acuerdo." },
          ]}
        />
      </Scene>
    </ScenePage>
  );
}
