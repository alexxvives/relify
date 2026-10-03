import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy } from "@/lib/landing-copy";

const sellerStats = [
  ["78", "Apariciones"],
  ["12", "Visitas"],
  ["4", "Intereses"],
] as const;

const investorRows = [
  ["Proyecto Norte", "Bilbao", "11,4M €", "/cities/city-bilbao.jpg"],
  ["Proyecto Lumen", "Madrid", "8,9M €", "/cities/city-madrid.jpg"],
  ["Proyecto Delta", "Barcelona", "21,5M €", "/cities/city-barcelona.jpg"],
] as const;

const advisorMandates = [
  ["Proyecto Alba", "NDA firmado"],
  ["Proyecto Sur", "Ficha publicada"],
  ["Proyecto Mar", "Interés recibido"],
] as const;

const advisorSteps = ["Ficha publicada", "Interés cualificado", "NDA", "Reunión"] as const;

export function Audiences() {
  const { sellers, investors, advisors } = landingCopy.audiences;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-12">
      <Audience
        id={sellers.id}
        eyebrow={sellers.eyebrow}
        heading={sellers.heading}
        accent={sellers.accent}
        body={sellers.body}
        moreHref="/empresas/vender"
        more={sellers.more}
        register={sellers.register}
        panel={<SellerWorkspace />}
      />
      <Audience
        id={investors.id}
        eyebrow={investors.eyebrow}
        heading={investors.heading}
        accent={investors.accent}
        body={investors.body}
        moreHref="/inversores/como-comprar"
        more={investors.more}
        register={investors.register}
        panel={<InvestorShortlist />}
      />
      <Audience
        id={advisors.id}
        eyebrow={advisors.eyebrow}
        heading={advisors.heading}
        accent={advisors.accent}
        body={advisors.body}
        moreHref="/asesores/mandatos"
        more={advisors.more}
        register={advisors.register}
        panel={<AdvisorBoard />}
      />
    </div>
  );
}

function Audience({
  id,
  eyebrow,
  heading,
  accent,
  body,
  moreHref,
  more,
  register,
  panel,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  accent: string;
  body: string;
  moreHref: string;
  more: string;
  register: string;
  panel: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[2rem] bg-public-card p-6 shadow-public sm:p-10">
      <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm text-public-muted">{eyebrow}</p>
          <h2 className="mt-3 text-4xl leading-[1.05] font-medium tracking-tight">
            {heading}
            <span className="mt-1 block">{accent}</span>
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-7 text-public-muted">{body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={moreHref} className="inline-flex h-12 items-center rounded-full px-5 text-[15px] text-public-clay">
              {more}
            </Link>
            <Link
              href="/registro"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-5 text-[15px] text-white transition hover:bg-public-clay-deep"
            >
              {register}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div>{panel}</div>
      </div>
    </section>
  );
}

function SellerWorkspace() {
  return (
    <div className="rounded-3xl bg-public-sand p-4 sm:p-5" aria-label="Panel de empresa en venta">
      <div className="flex items-center justify-between px-1 py-1">
        <span className="font-medium">Releva</span>
        <span className="text-xs text-public-muted">Panel de empresa</span>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl bg-public-card p-4">
          <p className="text-lg font-medium">Buenos días</p>
          <p className="text-sm text-public-muted">Proyecto Alba · Valencia</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {sellerStats.map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-public-sand px-2 py-3 text-center">
                <p className="text-2xl font-medium text-public-clay">{value}</p>
                <p className="text-[11px] text-public-muted">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl bg-public-sand px-3 py-2">
            <p className="text-xs tracking-wide text-public-muted uppercase">Acciones pendientes</p>
            <p className="mt-2 text-sm">Inversor industrial 1842 te ha enviado una solicitud</p>
          </div>
        </div>
        <div className="rounded-3xl bg-public-card p-4">
          <p className="text-sm text-public-muted">Inversor industrial 1842 · Madrid</p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="rounded-2xl bg-public-sand px-3 py-2">¿Los socios actuales quieren mantenerse en la operación?</p>
            <p className="rounded-2xl bg-public-paper px-3 py-2">Pueden quedarse vinculados. Preferimos hablarlo en una reunión.</p>
            <p className="rounded-2xl bg-public-sand px-3 py-2">Gracias. Propongo una llamada esta semana.</p>
          </div>
          <p className="mt-3 inline-flex rounded-full bg-public-sand px-3 py-1 text-xs text-public-moss">
            Solicitud de reunión enviada
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-3xl bg-public-card px-4 py-4">
        <p className="text-sm">Análisis de tu actividad</p>
        <p className="text-xs text-public-muted">Resumen semanal de visitas a la ficha</p>
        <div className="mt-3 flex h-16 items-end gap-2">
          {[40, 65, 48, 80, 58, 90, 72].map((height, index) => (
            <div key={index} className="flex-1 rounded-full bg-public-clay" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function InvestorShortlist() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]" aria-label="Panel de inversor">
      <div className="rounded-3xl bg-public-sand p-2">
        <p className="px-3 py-2 text-sm text-public-muted">Empresas que encajan</p>
        <ul className="space-y-2">
          {investorRows.map(([name, city, revenue, image]) => (
            <li key={name} className="flex items-center gap-3 rounded-2xl bg-public-card px-3 py-3">
              <Image src={image} alt="" width={72} height={48} className="h-12 w-16 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{name}</span>
                <span className="text-xs text-public-muted">{city}</span>
              </span>
              <span className="text-sm font-medium text-public-clay">{revenue}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-3xl bg-public-card">
          <Image src="/cities/city-barcelona.jpg" alt="" width={640} height={120} className="h-20 w-full object-cover" />
          <div className="p-4">
            <p className="text-lg font-medium">Proyecto Delta</p>
            <p className="text-sm text-public-muted">Barcelona · Industria</p>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Facturación", "21,5M €"],
                ["EBITDA", "4,1M €"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] tracking-wide text-public-muted uppercase">{label}</dt>
                  <dd className="text-sm font-medium text-public-clay">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="rounded-3xl bg-public-sand p-4">
          <p className="text-sm text-public-muted">Tu solicitud</p>
          <p className="mt-1 text-lg font-medium">Proyecto Norte</p>
          <p className="mt-3 text-sm">Solicitud enviada</p>
          <p className="mt-1 text-sm text-public-moss">La empresa ha aceptado</p>
        </div>
      </div>
    </div>
  );
}

function AdvisorBoard() {
  return (
    <div className="rounded-3xl bg-public-sand p-4" aria-label="Panel de asesor">
      <p className="text-sm text-public-muted">Mandatos en curso</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {advisorMandates.map(([name, status]) => (
          <div key={name} className="flex min-h-28 flex-col justify-between rounded-2xl bg-public-card px-3 py-3">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-[11px] text-public-muted">{status}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-3xl bg-public-card p-4">
        <p className="text-sm">Recorrido del mandato</p>
        <ol className="mt-3 flex gap-2 overflow-x-auto">
          {advisorSteps.map((step, index) => (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${index < 3 ? "bg-public-ink text-white" : "bg-public-sand text-public-muted"}`}
              >
                {index + 1}
              </span>
              <span className="leading-5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-3 rounded-3xl bg-public-card px-4 py-3">
        <p className="text-xs text-public-muted">Hoy · 18:40</p>
        <p className="mt-1 text-lg font-medium">Nuevo interés</p>
        <p className="text-sm text-public-muted">Un inversor ha pedido conexión con Proyecto Delta.</p>
        <p className="mt-2 text-xs text-public-muted">De IN 2204 · Hacia Proyecto Delta</p>
      </div>
    </div>
  );
}
