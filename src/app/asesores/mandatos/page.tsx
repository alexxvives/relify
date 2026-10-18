import type { Metadata } from "next";
import Link from "next/link";
import { MiniFicha } from "@/components/landing/scenes";
import { PublicSite } from "@/components/public-site";

const title = "El mandato entra con las mismas reglas que una empresa";
const description = "La ficha del mandato enseña ciudad, precio y cifras. El cliente no tiene nombre ahí.";

export const metadata: Metadata = { title: "Trae un mandato", description, robots: { index: false, follow: false } };

export default function MandatosPublicPage() {
  return (
    <PublicSite>
      <main className="px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-[1100px] items-start gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <MiniFicha name="Mandato Alba" region="Valencia" price="2,4 M€" cover="/hero/city.png" />
          <div className="lg:pt-6">
            <h1 className="text-4xl leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 text-public-muted">{description}</p>
            <Link href="/lista-de-espera" className="mt-6 inline-flex h-12 items-center rounded-full bg-public-clay px-6 text-white">
              Apuntarme como asesor
            </Link>
          </div>
        </div>
        <ul className="mx-auto mt-14 max-w-[1100px] divide-y divide-public-line border-y border-public-line" aria-label="Tu sitio">
          {[
            ["Valencia", "En curso"],
            ["Sevilla", "En revisión"],
            ["Alicante", "Publicado"],
          ].map(([city, state]) => (
            <li key={city} className="flex items-baseline justify-between py-5">
              <span className="text-3xl tracking-tight">{city}</span>
              <span className="text-sm text-public-muted">{state}</span>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-10 max-w-[1100px] text-lg leading-8">
          El comprador pide acceso. Tú aceptas. El acuerdo abre la sociedad.
        </p>
        <p className="mx-auto mt-3 max-w-[1100px] text-sm text-public-muted">El asesor no publica la razón social para adelantar la operación.</p>
      </main>
    </PublicSite>
  );
}
