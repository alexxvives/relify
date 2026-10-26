import type { Metadata } from "next";
import { Clock, LineChart, ShieldCheck } from "lucide-react";
import { ValuationSoon } from "@/components/valuation-soon";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Valora tu empresa",
  description:
    "Pronto podrás estimar el valor de tu pyme a partir del CIF. Hoy la valoración todavía no calcula un precio.",
  alternates: { canonical: "/valorar" },
};

export default function ValuationPage() {
  return (
    <PublicSite>
      <main className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-6 py-16 sm:px-10 lg:min-h-[calc(100svh-12rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:py-20">
        <div>
          <p className="text-sm text-public-clay">Próximamente</p>
          <h1 className="releva-page-title mt-3 max-w-3xl text-4xl leading-[1.02] md:text-6xl">
            Valora tu empresa
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-public-muted">
            Escribe el CIF y, cuando esta herramienta abra, verás una primera
            lectura del valor. Hoy no calculamos un precio, no consultamos el
            registro y no guardamos el número.
          </p>
          <ValuationSoon />
        </div>
        <aside
          className="rounded-3xl border border-[#e7eaee] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(28,39,64,0.45)] sm:p-8"
          aria-label="Qué tendrás"
        >
          <h2 className="text-lg font-semibold text-public-ink">
            Qué tendrás cuando abra
          </h2>
          <ul className="mt-5 flex flex-col gap-5">
            {[
              {
                icon: LineChart,
                title: "Una primera horquilla de valor",
                body: "Calculada con múltiplos de tu sector y tus cifras públicas.",
              },
              {
                icon: Clock,
                title: "En menos de un minuto",
                body: "Solo el CIF; sin formularios largos ni llamadas.",
              },
              {
                icon: ShieldCheck,
                title: "Sin rastro",
                body: "Hoy no guardamos el número. Cuando abra, te diremos qué guardamos antes de calcular.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f4] text-[#0f6b62]">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-public-ink">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-6 text-public-muted">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </PublicSite>
  );
}
