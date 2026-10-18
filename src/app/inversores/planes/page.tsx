import type { Metadata } from "next";
import Link from "next/link";
import { PublicSite } from "@/components/public-site";

const title = "Leer es gratis. Avanzar tiene un plan.";
const description = "Buscar y leer la ficha pública no cuesta. El contacto vive en el plan de pago.";

export const metadata: Metadata = { title: "Qué cuesta", description, robots: { index: false, follow: false } };

export default function PlanesPage() {
  return (
    <PublicSite>
      <main className="px-5 py-14 sm:px-8 sm:py-20">
        <h1 className="mx-auto max-w-3xl text-4xl leading-[1.02] tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-lg text-public-muted">{description}</p>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.8rem] border border-public-line bg-public-card p-8" aria-label="Gratis">
            <p className="text-sm tracking-[0.16em] text-public-muted uppercase">Gratis</p>
            <p className="mt-6 text-6xl tracking-tight">0 €</p>
            <ul className="mt-8 grid gap-3 text-xl">
              {["Buscar", "Guardar", "Leer la ficha pública"].map((item) => (
                <li key={item} className="border-t border-public-line pt-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[1.8rem] bg-public-ink p-8 text-white" aria-label="De pago">
            <p className="text-sm tracking-[0.16em] text-white/50 uppercase">De pago</p>
            <p className="mt-6 text-5xl tracking-tight">
              20 € <span className="text-white/40">/</span> 99 €
              <span className="ml-2 text-lg text-white/60">al mes</span>
            </p>
            <ul className="mt-8 grid gap-3 text-xl">
              {["Contacto con la operación", "Seguimiento del proceso"].map((item) => (
                <li key={item} className="border-t border-white/15 pt-3">
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/premium" className="mt-10 inline-flex h-12 items-center rounded-full bg-white px-6 text-public-ink">
              Ver los planes
            </Link>
          </section>
        </div>
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] bg-[#f4f1ea] px-6 py-5" aria-label="Qué no se cobra aquí">
          <p className="text-public-muted">El depósito de un asesor y el cierre de una operación no salen de esta página.</p>
          <Link href="/lista-de-espera" className="text-sm text-public-clay">
            Lista de espera
          </Link>
        </section>
        <p className="mt-4 text-sm text-public-muted">Mientras el cobro no esté abierto, el siguiente paso es la lista de espera.</p>
      </main>
    </PublicSite>
  );
}
