import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MiniFicha } from "@/components/landing/scenes";
import { PublicSite } from "@/components/public-site";

const title = "Publica la empresa sin decir cómo se llama";
const description = "Región, facturación, EBITDA y precio. La razón social se queda en el borrador.";

export const metadata: Metadata = { title: "Vender una empresa", description, robots: { index: false, follow: false } };

export default function VenderEmpresaPage() {
  return (
    <PublicSite>
      <main>
        <section className="grid items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:py-20">
          <div className="mx-auto w-full max-w-sm lg:mx-0">
            <MiniFicha />
          </div>
          <div className="max-w-xl">
            <h1 className="text-4xl leading-[1.02] tracking-tight sm:text-6xl">{title}</h1>
            <p className="mt-5 text-[16px] leading-7 text-public-muted">{description}</p>
            <dl className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Región", "Valencia"],
                ["Facturación", "1,8 M€"],
                ["EBITDA", "420 k€"],
                ["Precio", "2,4 M€"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs tracking-wide text-public-muted uppercase">{label}</dt>
                  <dd className="mt-1 text-2xl tracking-tight">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-public-muted line-through decoration-public-clay">Razón social · CIF</p>
            <Link href="/lista-de-espera" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white">
              Apuntar mi empresa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="border-y border-public-line bg-public-card px-5 py-8 sm:px-8" aria-label="El nombre de proyecto">
          <ol className="mx-auto flex max-w-[1440px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <li>
              <p className="text-sm text-public-muted">Borrador</p>
              <p className="mt-1 text-2xl">Alba Industrial, S.L.</p>
              <p className="text-sm text-public-muted">Solo la ves tú.</p>
            </li>
            <li>
              <p className="text-sm text-public-muted">Revisión</p>
              <p className="mt-1 text-2xl">Releva mira las cifras</p>
            </li>
            <li>
              <p className="text-sm text-public-clay">Publicada</p>
              <p className="mt-1 font-serif text-4xl italic">Proyecto Alba</p>
            </li>
          </ol>
        </section>
        <section className="px-5 py-12 sm:px-8" aria-label="Quién llama">
          <ul className="mx-auto flex max-w-[1440px] flex-wrap gap-x-10 gap-y-4">
            {[
              ["Madrid", "industria familiar"],
              ["Barcelona", "continuidad del equipo"],
              ["Bilbao", "EBITDA por encima de 300 k€"],
            ].map(([city, want]) => (
              <li key={city}>
                <p className="text-lg">{city}</p>
                <p className="text-sm text-public-muted">{want}</p>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-[1440px] text-sm text-public-muted">El detalle se abre cuando el vendedor acepta y se firma el acuerdo.</p>
        </section>
      </main>
    </PublicSite>
  );
}
