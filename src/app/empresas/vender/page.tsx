import type { Metadata } from "next";
import { MiniFicha, Scene, ScenePage, Trio } from "@/components/landing/scenes";

const title = "Publica la empresa sin decir cómo se llama";
const description = "Región, facturación, EBITDA y precio. La razón social se queda en el borrador.";

export const metadata: Metadata = { title: "Vender una empresa", description, robots: { index: false, follow: false } };

export default function VenderEmpresaPage() {
  return (
    <ScenePage
      eyebrow="Empresas"
      title={title}
      lead={description}
      cta={{ href: "/lista-de-espera", label: "Apuntar mi empresa" }}
      close="El detalle se abre cuando el vendedor acepta y se firma el acuerdo."
    >
      <Scene label="La ficha">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <MiniFicha />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Región", "Valencia"],
              ["Facturación", "1,8 M€"],
              ["EBITDA", "420 k€"],
              ["Precio", "2,4 M€"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.2rem] bg-[#f4f1ea] px-4 py-4">
                <p className="text-xs tracking-wide text-public-muted uppercase">{label}</p>
                <p className="mt-1 text-xl">{value}</p>
              </div>
            ))}
            <div className="rounded-[1.2rem] bg-public-ink/6 px-4 py-4 text-public-muted sm:col-span-2">
              <p className="text-xs tracking-wide uppercase">Fuera de la ficha</p>
              <p className="mt-1 text-lg line-through decoration-public-clay">Razón social · CIF</p>
            </div>
          </div>
        </div>
      </Scene>
      <Scene label="El nombre de proyecto">
        <Trio
          items={[
            { title: "Borrador", body: "Alba Industrial, S.L. solo la ves tú." },
            { title: "Revisión", body: "Releva mira las cifras antes de publicar." },
            { title: "Publicada", body: "El catálogo dice Proyecto Alba.", live: true },
          ]}
        />
      </Scene>
      <Scene label="Quién llama">
        <ul className="grid gap-3 md:grid-cols-3">
          {[
            ["Madrid", "Busca industria familiar"],
            ["Barcelona", "Quiere continuidad del equipo"],
            ["Bilbao", "Mira EBITDA por encima de 300 k€"],
          ].map(([city, want]) => (
            <li key={city} className="rounded-[1.2rem] border border-public-line px-4 py-4">
              <p className="text-lg">{city}</p>
              <p className="mt-1 text-sm text-public-muted">{want}</p>
            </li>
          ))}
        </ul>
      </Scene>
    </ScenePage>
  );
}
