import type { Metadata } from "next";
import { MiniFicha, Scene, ScenePage, Trio } from "@/components/landing/scenes";

const title = "El nombre de la sociedad no está en la ficha";
const description = "La razón social vive en el borrador del vendedor. La ficha pública no la enseña.";

export const metadata: Metadata = { title: "Confidencialidad", description, robots: { index: false, follow: false } };

export default function ConfidencialidadPage() {
  return (
    <ScenePage
      eyebrow="Empresas"
      title={title}
      lead={description}
      cta={{ href: "/empresas/vender", label: "Cómo se publica" }}
      close="La ficha pública no cambia de forma cuando entra un comprador."
    >
      <Scene label="Dos capas">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm text-public-muted">Ficha pública</p>
            <MiniFicha />
          </div>
          <div className="rounded-[1.4rem] bg-[#f4f1ea] p-5">
            <p className="text-sm text-public-muted">Borrador del vendedor</p>
            <p className="mt-4 text-3xl tracking-tight">Alba Industrial, S.L.</p>
            <p className="mt-2 text-public-muted">CIF B12345678 · solo en este borrador</p>
            <p className="mt-8 text-sm text-public-muted">Al publicar, el catálogo sigue diciendo Proyecto Alba.</p>
          </div>
        </div>
      </Scene>
      <Scene label="El paso del acuerdo">
        <Trio
          items={[
            { title: "Interés", body: "El comprador ve Proyecto Alba." },
            { title: "Aceptación", body: "El vendedor decide si abre la conversación." },
            { title: "Firma", body: "Ahí aparece Alba Industrial, S.L.", live: true },
          ]}
        />
      </Scene>
      <Scene label="Quién lo ve">
        <ul className="grid gap-3 md:grid-cols-3">
          {["Vendedor", "Comprador aceptado", "Asesor del mandato"].map((who) => (
            <li key={who} className="rounded-[1.2rem] bg-public-ink px-5 py-8 text-center text-xl text-white">
              {who}
            </li>
          ))}
        </ul>
      </Scene>
    </ScenePage>
  );
}
