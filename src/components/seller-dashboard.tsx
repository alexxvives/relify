import Link from "next/link";
import { LineChart as LineIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ChartBox, ColumnBars, KpiTile, LegendDot, LineChart, YearTable, type Series } from "@/components/company-report-charts";
import { metrics, navy, reportMargins, teal, type Metric } from "@/lib/report-format";
import type { SabiYear } from "@/lib/sabi/insights";

/**
 * t74: seller Inicio "Cómo va tu empresa". The same charts, gauges and K/M/n-s formatting as the
 * admin report, fed only with the seller's own closed years.
 */
export function SellerDashboard({
  years,
}: {
  years: SabiYear[];
  /** Kept for the caller; t83 moved team and balance out of Inicio. */
  directors?: number;
  shareholders?: number;
}) {
  const { kpis } = metrics(years);
  const revenue = kpis.find((metric) => metric.key === "revenue");
  const margin = kpis.find((metric) => metric.key === "ebitdaMargin");
  const ebitda: Metric = {
    key: "ebitda",
    label: "EBITDA",
    unit: "eur",
    better: "up",
    values: years.map((year) => year.ebitdaCents),
    hint: "Resultado de explotación antes de amortizaciones, intereses e impuestos. Es la cifra con la que los compradores valoran la empresa.",
  };
  const employees: Metric = {
    key: "employees",
    label: "Empleados",
    unit: "people",
    better: "none",
    values: years.map((year) => year.employees),
    hint: "Plantilla media declarada en las cuentas del ejercicio.",
  };
  const tiles = [revenue, ebitda, margin, employees].filter(
    (metric): metric is Metric => metric !== undefined && (metric.values.some((value) => value !== null) || (metric.ns ?? []).some(Boolean)),
  );
  // t83: Inicio keeps it short; revenue and EBITDA plus the EBITDA margin. The full report lives in the ficha.
  const trend: Series[] = [
    { label: "Ingresos", color: navy, values: years.map((year) => year.revenueCents) },
    { label: "EBITDA", color: teal, values: years.map((year) => year.ebitdaCents) },
  ].filter((item) => item.values.some((value) => value !== null));
  const margins: Array<Series & { ns: boolean[] }> = [
    { label: "Margen EBITDA", color: teal, ...reportMargins(years, (year) => year.ebitdaCents) },
  ].filter((item) => item.values.some((value) => value !== null) || item.ns.some(Boolean));

  return (
    <div className="mt-4 flex flex-col gap-5">
      {tiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {tiles.map((metric) => (
            <KpiTile key={metric.key} metric={metric} years={years} />
          ))}
        </div>
      ) : null}

      {trend.length > 0 ? (
        <Block icon={<LineIcon className="size-4" aria-hidden />} title="Evolución">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartBox
              title="Ingresos y EBITDA"
              legend={trend.map((item) => <LegendDot key={item.label} color={item.color} label={item.label} />)}
              table={<YearTable years={years} rows={trend.map((item) => ({ label: item.label, unit: "eur", values: item.values }))} />}
            >
              <ColumnBars years={years} series={trend} unit="eur" />
            </ChartBox>
            {margins.length > 0 ? (
              <ChartBox
                title="Margen EBITDA"
                hint="Qué parte de los ingresos queda como EBITDA. En años con ingresos casi nulos se muestra n/s."
                legend={margins.map((item) => <LegendDot key={item.label} color={item.color} label={item.label} />)}
                table={<YearTable years={years} rows={margins.map((item) => ({ label: item.label, unit: "pct", values: item.values, ns: item.ns }))} />}
              >
                <LineChart years={years} series={margins} unit="pct" />
              </ChartBox>
            ) : null}
          </div>
        </Block>
      ) : null}

      <Link
        href="/mi-empresa/detalles?seccion=price#ficha-detalles"
        className="self-start text-sm font-medium text-[#0f766e] underline-offset-2 hover:underline"
      >
        Ver el informe completo de tu ficha
      </Link>
    </div>
  );
}

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-[#1c2740]">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#e6f6f3] text-[#0f766e]">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}
