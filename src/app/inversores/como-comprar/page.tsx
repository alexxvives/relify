import type { Metadata } from "next";
import Link from "next/link";
import { MiniFicha } from "@/components/landing/scenes";
import { PublicSite } from "@/components/public-site";

const title = "Lees la empresa antes de saber quién es";
const description = "El catálogo abre región y cifras. La sociedad espera al acuerdo.";

export const metadata: Metadata = { title: "Cómo comprar", description, robots: { index: false, follow: false } };

export default function ComoComprarPage() {
  return (
    <PublicSite>
      <main>
        <section className="px-5 pt-14 pb-6 sm:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-4">
            <h1 className="max-w-xl text-4xl leading-[1.02] tracking-tight sm:text-5xl">{title}</h1>
            <Link href="/mercado" className="inline-flex h-11 items-center rounded-full border border-public-ink px-5 text-sm">
              Ver empresas
            </Link>
          </div>
          <p className="mx-auto mt-3 max-w-[1440px] text-public-muted">{description}</p>
        </section>
        <section className="grid gap-4 px-5 sm:px-8 md:grid-cols-3" aria-label="El catálogo">
          <MiniFicha name="Proyecto Alba" region="Valencia" price="2,4 M€" cover="/hero/city-2.png" />
          <MiniFicha name="Proyecto Nube" region="Madrid" price="1,1 M€" cover="/hero/city.png" />
          <MiniFicha name="Proyecto Cala" region="Málaga" price="3,6 M€" cover="/hero/city-3.png" />
        </section>
        <section className="mx-5 mt-10 overflow-hidden rounded-[1.6rem] border border-public-line sm:mx-8" aria-label="Pedir acceso">
          <div className="grid md:grid-cols-3">
            {[
              ["En espera", "La solicitud está con el vendedor."],
              ["Aceptado", "Puedes firmar el acuerdo."],
              ["Acuerdo firmado", "Se abre la operación."],
            ].map(([step, body], index) => (
              <div key={step} className={`px-6 py-8 ${index === 2 ? "bg-public-clay text-white" : "bg-public-card"}`}>
                <p className="text-xs tracking-[0.14em] uppercase opacity-70">Conectar</p>
                <p className="mt-3 text-2xl">{step}</p>
                <p className={`mt-2 text-sm ${index === 2 ? "text-white/80" : "text-public-muted"}`}>{body}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-px bg-public-line px-5 py-14 sm:px-8 md:grid-cols-3" aria-label="Lo que se abre">
          {["Preguntas", "Reunión", "Oferta"].map((item) => (
            <p key={item} className="bg-public-paper px-2 py-8 text-center">
              <span className="block text-3xl tracking-tight text-public-muted">{item}</span>
              <span className="mt-2 block text-sm text-public-muted">Cerrado hasta el acuerdo.</span>
            </p>
          ))}
        </section>
        <p className="px-5 pb-12 text-center text-sm text-public-muted sm:px-8">El plan gratuito ya deja leer el catálogo.</p>
      </main>
    </PublicSite>
  );
}
