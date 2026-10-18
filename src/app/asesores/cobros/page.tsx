import type { Metadata } from "next";
import Link from "next/link";
import { PublicSite } from "@/components/public-site";

const title = "Cobras cuando el trabajo ya está encargado";
const description = "Hay un depósito reembolsable cuando el encargo ya está aceptado. La cantidad se ve al entrar.";

export const metadata: Metadata = { title: "Cómo cobras", description, robots: { index: false, follow: false } };

export default function CobrosPage() {
  return (
    <PublicSite>
      <main>
        <section className="px-5 py-16 text-center sm:px-8 sm:py-24">
          <p className="text-sm tracking-[0.16em] text-public-muted uppercase">{title}</p>
          <p className="mx-auto mt-6 max-w-lg text-2xl leading-9 text-public-ink">{description}</p>
          <p className="mx-auto mt-4 max-w-md text-public-muted">Esta página no abre una pasarela.</p>
        </section>
        <section className="mx-auto grid max-w-3xl gap-6 px-5 pb-16 sm:px-8 md:grid-cols-[1.1fr_0.9fr]" aria-label="El encargo">
          <article className="rounded-[1.6rem] bg-public-ink p-8 text-white">
            <p className="text-3xl">Proyecto Alba</p>
            <p className="mt-2 text-white/60">Due diligence</p>
            <div className="mt-10 flex gap-3 text-sm">
              <span className="rounded-full bg-white/10 px-4 py-2">Pendiente de depósito</span>
              <span className="rounded-full bg-white px-4 py-2 text-public-ink">En curso</span>
            </div>
          </article>
          <ul className="flex flex-col justify-center gap-4 text-lg">
            <li>No hay suscripción de asesor.</li>
            <li>No hay comisión en esta página.</li>
            <li>El cierre de la operación se acuerda fuera.</li>
          </ul>
        </section>
        <p className="pb-12 text-center text-sm text-public-muted">
          Releva no cobra al pedir el presupuesto.{" "}
          <Link href="/asesores/servicios" className="text-public-clay">
            Ver un encargo
          </Link>
        </p>
      </main>
    </PublicSite>
  );
}
