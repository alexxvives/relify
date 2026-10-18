import type { Metadata } from "next";
import Link from "next/link";
import { MiniFicha } from "@/components/landing/scenes";
import { PublicSite } from "@/components/public-site";

const title = "Esto es lo que lee alguien que aún no te conoce";
const description = "Nombre de proyecto, región y cifras. La sociedad no está en esa lectura.";

export const metadata: Metadata = { title: "Qué se ve", description, robots: { index: false, follow: false } };

const shown = ["Nombre de proyecto", "Región", "Facturación", "EBITDA", "EBITDA ajustado", "Precio"];
const hidden = ["Razón social", "CIF", "Nombres del data room"];
const opened = ["Alba Industrial, S.L.", "B12345678", "Cuentas y contratos"];

export default function QueSeVePage() {
  return (
    <PublicSite>
      <main>
        <section className="bg-public-ink px-5 py-16 text-white sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-[1440px] items-end gap-10 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <div>
              <h1 className="max-w-xl text-4xl leading-[1.02] tracking-tight sm:text-6xl">{title}</h1>
              <p className="mt-5 max-w-md text-white/70">{description}</p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {shown.map((item) => (
                  <li key={item} className="rounded-full border border-white/20 px-4 py-2 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <MiniFicha />
          </div>
        </section>
        <section className="grid md:grid-cols-3" aria-label="Lo que no sale">
          {hidden.map((item) => (
            <p key={item} className="grid min-h-48 place-items-center border-b border-public-line px-6 text-center text-3xl text-public-muted line-through decoration-public-clay md:border-r md:border-b-0">
              {item}
            </p>
          ))}
        </section>
        <section className="grid items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,22rem)_1fr]" aria-label="Después del acuerdo">
          <MiniFicha open />
          <div>
            <ul className="grid gap-2">
              {opened.map((item) => (
                <li key={item} className="border-b border-public-line py-3 text-2xl tracking-tight">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-md text-sm text-public-muted">Lo que estaba bloqueado llega solo después del acuerdo de confidencialidad.</p>
            <Link href="/mercado" className="mt-6 inline-flex h-12 items-center rounded-full bg-public-clay px-6 text-white">
              Ver una ficha
            </Link>
          </div>
        </section>
      </main>
    </PublicSite>
  );
}
