import type { Metadata } from "next";
import { ValuationSoon } from "@/components/valuation-soon";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Valora tu empresa",
  description: "Pronto podrás estimar el valor de tu pyme a partir del CIF. Hoy la valoración todavía no calcula un precio.",
  alternates: { canonical: "/valorar" },
};

export default function ValuationPage() {
  return (
    <PublicSite>
      <main className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:px-10 lg:py-24">
        <p className="text-sm text-public-clay">Próximamente</p>
        <h1 className="releva-page-title mt-3 max-w-3xl text-4xl leading-[1.02] md:text-6xl">Valora tu empresa</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-public-muted">
          Escribe el CIF y, cuando esta herramienta abra, verás una primera lectura del valor. Hoy no calculamos un precio, no consultamos el registro y no guardamos el número.
        </p>
        <ValuationSoon />
      </main>
    </PublicSite>
  );
}
