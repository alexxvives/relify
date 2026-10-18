import type { Metadata } from "next";
import Link from "next/link";
import { MiniFicha } from "@/components/landing/scenes";
import { PublicSite } from "@/components/public-site";

const title = "El nombre de la sociedad no está en la ficha";
const description = "La razón social vive en el borrador del vendedor. La ficha pública no la enseña.";

export const metadata: Metadata = { title: "Confidencialidad", description, robots: { index: false, follow: false } };

export default function ConfidencialidadPage() {
  return (
    <PublicSite>
      <main className="px-5 py-14 sm:px-8 sm:py-20">
        <h1 className="mx-auto max-w-3xl text-center text-4xl leading-[1.02] tracking-tight sm:text-6xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-public-muted">{description}</p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2" aria-label="Dos capas">
          <div>
            <p className="mb-3 text-sm text-public-muted">Ficha pública</p>
            <MiniFicha cover="/hero/city-3.png" />
          </div>
          <div className="flex flex-col justify-between rounded-[1.6rem] bg-[#12343a] p-8 text-white">
            <p className="text-sm text-white/60">Borrador del vendedor</p>
            <p className="mt-10 text-4xl leading-tight tracking-tight">Alba Industrial, S.L.</p>
            <p className="mt-3 text-white/70">CIF B12345678 · solo en este borrador</p>
            <p className="mt-10 text-sm text-white/60">Al publicar, el catálogo sigue diciendo Proyecto Alba.</p>
          </div>
        </div>
        <ol className="mx-auto mt-16 grid max-w-5xl gap-8 border-t border-public-line pt-8 md:grid-cols-3" aria-label="El paso del acuerdo">
          {[
            ["Interés", "El comprador ve Proyecto Alba."],
            ["Aceptación", "El vendedor decide si abre la conversación."],
            ["Firma", "Ahí aparece Alba Industrial, S.L."],
          ].map(([step, body], index) => (
            <li key={step} className={index === 2 ? "text-public-clay" : ""}>
              <p className="text-xs tracking-[0.16em] uppercase">{step}</p>
              <p className="mt-2 text-lg text-public-ink">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-12 max-w-3xl text-center text-xl">
          Lo ven el vendedor, el comprador aceptado y el asesor del mandato. Nadie más.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-public-muted">La ficha pública no cambia de forma cuando entra un comprador.</p>
        <p className="mt-8 text-center">
          <Link href="/empresas/vender" className="inline-flex h-12 items-center rounded-full bg-public-clay px-6 text-white">
            Cómo se publica
          </Link>
        </p>
      </main>
    </PublicSite>
  );
}
