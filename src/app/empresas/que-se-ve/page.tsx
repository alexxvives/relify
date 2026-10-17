import type { Metadata } from "next";
import { MiniFicha, Scene, ScenePage } from "@/components/landing/scenes";

const title = "Esto es lo que lee alguien que aún no te conoce";
const description = "Nombre de proyecto, región y cifras. La sociedad no está en esa lectura.";

export const metadata: Metadata = { title: "Qué se ve", description, robots: { index: false, follow: false } };

const shown = ["Nombre de proyecto", "Región", "Facturación", "EBITDA", "EBITDA ajustado", "Precio"];
const hidden = ["Razón social", "CIF", "Nombres del data room"];
const opened = ["Alba Industrial, S.L.", "B12345678", "Cuentas y contratos"];

export default function QueSeVePage() {
  return (
    <ScenePage
      eyebrow="Empresas"
      title={title}
      lead={description}
      cta={{ href: "/mercado", label: "Ver una ficha" }}
      close="Lo que estaba bloqueado llega solo después del acuerdo de confidencialidad."
    >
      <Scene label="La cara pública">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <MiniFicha />
          <ul className="grid gap-3 sm:grid-cols-2">
            {shown.map((item) => (
              <li key={item} className="rounded-[1.2rem] bg-[#f4f1ea] px-4 py-4 text-lg">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Scene>
      <Scene label="Lo que no sale">
        <ul className="grid gap-3 md:grid-cols-3">
          {hidden.map((item) => (
            <li key={item} className="grid min-h-36 place-items-center rounded-[1.4rem] bg-public-ink px-4 text-center text-xl text-white/80 line-through decoration-public-clay">
              {item}
            </li>
          ))}
        </ul>
      </Scene>
      <Scene label="Después del acuerdo">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <MiniFicha open />
          <ul className="grid gap-3">
            {opened.map((item) => (
              <li key={item} className="rounded-[1.2rem] border border-public-clay/40 bg-[#f4f1ea] px-4 py-4 text-lg">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Scene>
    </ScenePage>
  );
}
