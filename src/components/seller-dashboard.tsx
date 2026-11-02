import Link from "next/link";
import { Gauge, LineChart as LineIcon, Scale, Users } from "lucide-react";
import type { ReactNode } from "react";
import { BalanceReading } from "@/components/company-report";
import { BalanceStacks, ChartBox, ColumnBars, KpiTile, LegendDot, LineChart, SignalGauge, YearTable, type Series } from "@/components/company-report-charts";
import { healthSignals } from "@/lib/company-report";
import { metrics, navy, reportMargins, teal, tealLight, tealMid, type Metric } from "@/lib/report-format";
import type { SabiYear } from "@/lib/sabi/insights";

/**
 * t74: seller Inicio "Cómo va tu empresa". The same charts, gauges and K/M/n-s formatting as the
 * admin report, fed only with the seller's own closed years.
 */
export function SellerDashboard({
  years,
  directors,
  shareholders,
}: {
  years: SabiYear[];
  directors: number;
  shareholders: number;
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
  const trend: Series[] = [
    { label: "Ingresos", color: navy, values: years.map((year) => year.revenueCents) },
    { label: "EBITDA", color: teal, values: years.map((year) => year.ebitdaCents) },
    { label: "Resultado del ejercicio", color: tealLight, values: years.map((year) => year.netResultCents) },
  ].filter((item) => item.values.some((value) => value !== null));
  const margins: Array<Series & { ns: boolean[] }> = [
    { label: "Margen EBITDA", color: teal, ...reportMargins(years, (year) => year.ebitdaCents) },
    { label: "Margen neto", color: navy, ...reportMargins(years, (year) => year.netResultCents) },
  ].filter((item) => item.values.some((value) => value !== null) || item.ns.some(Boolean));
  const signals = healthSignals(years);
  const latestBalance = [...years].reverse().find((year) => year.totalAssetsCents !== null && year.totalAssetsCents > 0) ?? null;
  const latestEmployees = [...years].reverse().find((year) => year.employees !== null)?.employees ?? null;

  return (
    <div className="mt-4 flex flex-col gap-6">
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
              title="Ingresos, EBITDA y resultado"
              legend={trend.map((item) => <LegendDot key={item.label} color={item.color} label={item.label} />)}
              table={<YearTable years={years} rows={trend.map((item) => ({ label: item.label, unit: "eur", values: item.values }))} />}
            >
              <ColumnBars years={years} series={trend} unit="eur" />
            </ChartBox>
            {margins.length > 0 ? (
              <ChartBox
                title="Tendencia de márgenes"
                hint="Qué parte de los ingresos queda como EBITDA y como resultado neto. En años con ingresos casi nulos se muestra n/s."
                legend={margins.map((item) => <LegendDot key={item.label} color={item.color} label={item.label} />)}
                table={<YearTable years={years} rows={margins.map((item) => ({ label: item.label, unit: "pct", values: item.values, ns: item.ns }))} />}
              >
                <LineChart years={years} series={margins} unit="pct" />
              </ChartBox>
            ) : null}
          </div>
        </Block>
      ) : null}

      {signals.length > 0 ? (
        <Block icon={<Gauge className="size-4" aria-hidden />} title="Salud financiera">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {signals.map((signal) => (
              <SignalGauge key={signal.key} signal={signal} />
            ))}
          </div>
        </Block>
      ) : null}

      <Block icon={<Scale className="size-4" aria-hidden />} title="Balance y equipo">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {latestBalance ? (
            <ChartBox
              title="Estructura del balance"
              hint="Para cada año, la barra izquierda es lo que la empresa tiene (activo) y la derecha cómo se financia. Ambas suman lo mismo."
              legend={[
                <LegendDot key="anc" color={navy} label="Activo no corriente" />,
                <LegendDot key="ac" color="#5b6b8c" label="Activo corriente" />,
                <LegendDot key="pn" color={teal} label="Patrimonio neto" />,
                <LegendDot key="pnc" color={tealMid} label="Pasivo no corriente" />,
                <LegendDot key="pc" color={tealLight} label="Pasivo corriente" />,
              ]}
            >
              <BalanceStacks years={years} />
            </ChartBox>
          ) : (
            <p className="rounded-xl border border-dashed border-[#d6dbe3] p-4 text-sm text-[#667085]">
              Aún no hay balance.{" "}
              <Link href="/mi-empresa/detalles?seccion=balance#panel-balance" className="font-medium text-[#0f766e] underline-offset-2 hover:underline">
                Añádelo en Detalles
              </Link>
              .
            </p>
          )}
          <div className="flex flex-col gap-4">
            {latestBalance ? <BalanceReading year={latestBalance} /> : null}
            <section className="rounded-xl border border-[#e7eaee] bg-white p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#1c2740]">
                <Users className="size-4 text-[#0f766e]" aria-hidden /> Equipo
              </h3>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Empleados" value={latestEmployees} />
                <Stat label="Administradores" value={directors > 0 ? directors : null} />
                <Stat label="Accionistas" value={shareholders > 0 ? shareholders : null} />
              </dl>
            </section>
          </div>
        </div>
      </Block>

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

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col-reverse rounded-lg bg-[#f6f8fb] px-2 py-3">
      <dt className="mt-0.5 text-[11px] text-[#667085]">{label}</dt>
      <dd className="text-xl font-semibold text-[#1c2740] tabular-nums">{value === null ? "—" : value}</dd>
    </div>
  );
}
