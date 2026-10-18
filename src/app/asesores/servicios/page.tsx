import type { Metadata } from "next";
import Link from "next/link";
import { PublicSite } from "@/components/public-site";
import { advisoryServices } from "@/lib/advisory";

const title = "Seis formas de entrar en una operación";
const description = "El inversor elige el servicio. El trabajo empieza cuando el depósito está pagado.";

export const metadata: Metadata = { title: "Servicios", description, robots: { index: false, follow: false } };

const verbs = ["Revisar", "Valorar", "Acompañar", "Ordenar", "Proyectar", "Alinear"] as const;

export default function ServiciosPublicPage() {
  return (
    <PublicSite>
      <main className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-4">
          <h1 className="max-w-lg text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
          <p className="max-w-xs text-sm leading-6 text-public-muted">{description}</p>
        </div>
        <ul className="mx-auto mt-10 grid max-w-[1440px] gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {advisoryServices.map((service, index) => (
            <li key={service.id} className="flex min-h-52 flex-col justify-between rounded-[1.6rem] bg-public-card p-6 shadow-public">
              <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{verbs[index]}</p>
              <div>
                <p className="text-2xl tracking-tight">{service.title}</p>
                <p className="mt-2 text-sm leading-6 text-public-muted">{service.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-10 max-w-[1440px] text-lg">
          El inversor elige. El asesor ve el encargo. El trabajo empieza con el depósito pagado.
        </p>
        <p className="mx-auto mt-2 max-w-[1440px] text-sm text-public-muted">Marketplace, encargo, chat y reuniones. Pedir un servicio no cobra a nadie en esta página.</p>
        <Link href="/asesoramiento" className="mt-6 inline-flex h-12 items-center rounded-full bg-public-ink px-6 text-white">
          Ver servicios
        </Link>
      </main>
    </PublicSite>
  );
}
