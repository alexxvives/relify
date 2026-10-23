import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy } from "@/lib/landing-copy";

const softLink =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#eef1f4] px-5 text-[15px] text-[#2b3b4a] transition hover:bg-[#e4e8ee]";
const solidLink =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#465ab4] px-5 text-[15px] text-white transition hover:bg-[#3c4e9e]";

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
    <div>
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
    <section id={id} className="scroll-mt-24 px-4 py-12 sm:py-20">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-[#465ab4] uppercase">{eyebrow}</p>
          <h2 className="mt-3 text-[36px] leading-[1.05] font-normal tracking-[-0.02em] text-[#2b3b4a] sm:text-[48px]">
            {heading}
            <span className="block text-[#465ab4]">{accent}</span>
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-7 text-[#3e4d5c]">{body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={moreHref} className={softLink}>
              {more}
            </Link>
            <Link href="/registro" className={solidLink}>
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
    <div className="overflow-hidden rounded-3xl border border-[#d7cfc3] bg-[#f6f1e8]" aria-label="Panel de empresa en venta">
      <div className="flex items-center justify-between bg-[#243140] px-5 py-3 text-white">
        <span className="font-medium">Relify</span>
        <span className="text-xs text-white/70">Panel de empresa</span>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[1.15fr_0.85fr] sm:p-5">
        <div>
          <p className="text-lg text-[#2b3b4a]">Buenos días</p>
          <p className="text-sm text-[#6d7c89]">Proyecto Alba · Valencia</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {sellerStats.map(([value, label]) => (
              <div key={label} className="rounded-xl bg-white px-2 py-3">
                <p className="text-2xl font-medium text-[#243140]">{value}</p>
                <p className="text-[11px] text-[#6d7c89]">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl bg-white p-3">
            <p className="text-xs font-medium tracking-wide text-[#7b8792] uppercase">Acciones pendientes</p>
            <p className="mt-2 text-sm">Inversor industrial 1842 te ha enviado una solicitud</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-sm text-[#6d7c89]">Inversor industrial 1842 · Madrid</p>
          <div className="mt-3 space-y-2">
            <p className="ml-6 rounded-2xl rounded-tr-md bg-[#eef2fb] px-3 py-2 text-sm text-[#2b3b4a]">
              ¿Los socios actuales quieren mantenerse en la operación?
            </p>
            <p className="mr-6 rounded-2xl rounded-tl-md bg-[#f4f6f8] px-3 py-2 text-sm text-[#2b3b4a]">
              Pueden quedarse vinculados. Preferimos hablarlo en una reunión.
            </p>
            <p className="ml-6 rounded-2xl rounded-tr-md bg-[#eef2fb] px-3 py-2 text-sm text-[#2b3b4a]">
              Gracias. Propongo una llamada esta semana.
            </p>
          </div>
          <p className="mt-3 inline-flex rounded-full bg-[#e8eefc] px-3 py-1 text-xs font-medium text-[#465ab4]">
            Solicitud de reunión enviada
          </p>
        </div>
      </div>
      <div className="border-t border-[#e4d9c8] px-5 py-4">
        <p className="text-sm font-medium">Análisis de tu actividad</p>
        <p className="text-xs text-[#6d7c89]">Resumen semanal de visitas a la ficha</p>
        <div className="mt-3 flex h-16 items-end gap-2">
          {[40, 65, 48, 80, 58, 90, 72].map((height, index) => (
            <div key={index} className="flex-1 rounded-t bg-[#c4a574]" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function InvestorShortlist() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" aria-label="Panel de inversor">
      <div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white">
        <p className="border-b border-[#eef1f4] px-4 py-3 text-sm text-[#6d7c89]">Empresas que encajan</p>
        <ul>
          {investorRows.map(([name, city, revenue, image]) => (
            <li key={name} className="flex items-center gap-3 border-b border-[#eef1f4] px-3 py-3 last:border-b-0">
              <Image src={image} alt="" width={72} height={48} className="h-12 w-16 rounded-md object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{name}</span>
                <span className="text-xs text-[#6d7c89]">{city}</span>
              </span>
              <span className="text-sm font-medium text-[#465ab4]">{revenue}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-2xl bg-[#1d2a3a] text-white">
          <Image src="/cities/city-barcelona.jpg" alt="" width={640} height={120} className="h-20 w-full object-cover opacity-80" />
          <div className="p-4">
            <p className="text-lg font-medium">Proyecto Delta</p>
            <p className="text-sm text-white/70">Barcelona · Industria</p>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Facturación", "21,5M €"],
                ["EBITDA", "4,1M €"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] tracking-wide text-white/60 uppercase">{label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-[#465ab4] bg-[#f4f7ff] p-4">
          <p className="text-sm text-[#6d7c89]">Tu solicitud</p>
          <p className="mt-1 text-lg font-medium text-[#243140]">Proyecto Norte</p>
          <p className="mt-3 text-sm">Solicitud enviada</p>
          <p className="mt-1 text-sm font-medium text-[#465ab4]">La empresa ha aceptado</p>
        </div>
      </div>
    </div>
  );
}

function AdvisorBoard() {
  return (
    <div aria-label="Panel de asesor">
      <p className="text-sm font-medium text-[#6d7c89]">Mandatos en curso</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {advisorMandates.map(([name, status]) => (
          <div key={name} className="flex min-h-28 flex-col justify-between rounded-none border-t-4 border-[#465ab4] bg-[#f7f8fb] px-3 py-3">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-[11px] text-[#465ab4]">{status}</p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium">Recorrido del mandato</p>
        <ol className="mt-3 flex gap-2 overflow-x-auto">
          {advisorSteps.map((step, index) => (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${index < 3 ? "bg-[#243140] text-white" : "bg-[#e7ebf0] text-[#6d7c89]"}`}
              >
                {index + 1}
              </span>
              <span className="leading-5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-5 border-l-4 border-[#c4a574] bg-[#fbf7f1] px-4 py-3">
        <p className="text-xs text-[#7b8792]">Hoy · 18:40</p>
        <p className="mt-1 text-lg font-medium">Nuevo interés</p>
        <p className="text-sm text-[#3e4d5c]">Un inversor ha pedido conexión con Proyecto Delta.</p>
        <p className="mt-2 text-xs text-[#6d7c89]">De IN 2204 · Hacia Proyecto Delta</p>
      </div>
    </div>
  );
}
