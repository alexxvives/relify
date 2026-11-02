import { cloneElement, isValidElement, type ReactNode } from "react";
import {
  ClipboardCheck,
  Briefcase,
  Building2,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  EyeOff,
  FileSpreadsheet,
  HandCoins,
  Landmark,
  LineChart as LineChartIcon,
  PieChart,
  Scale,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
  Map,
  CalendarDays,
  Receipt,
  Mail,
  Phone,
  IdCard,
  FileCheck2,
} from "lucide-react";
import { ReportNav } from "@/components/report-nav";
import {
  BalanceStacks,
  ChartBox,
  ColumnBars,
  Empty,
  HoldingTable,
  ChartTip,
  KpiTile,
  LegendDot,
  LineChart,
  People,
  Section,
  SignalGauge,
  ShareholderTable,
  Toggle,
  Waterfall,
  YearTable,
} from "@/components/company-report-charts";
import { formatValue, isoDay, metrics, navy, registryText, reportMargins, schemeLabels, teal, tealLight, tealMid, yearLabel, type Metric } from "@/lib/report-format";
import type { Series } from "@/components/company-report-charts";
import { FieldHint } from "@/components/field-hint";
import { InfoHint } from "@/components/ui/info-hint";
import { FinancialTable } from "@/components/financial-table";
import { IndicatorTable } from "@/components/indicator-table";
import { RoiChip } from "@/components/market-card";
import { ProfileBalanceChart, ProfileIncomeChart } from "@/components/profile-statement-charts";
import { ShareDonut } from "@/components/share-donut";
import { companyCopy } from "@/lib/company-copy";
import { saleReasonLabels, saleReasons } from "@/lib/company-draft";
import { formatBasisPoints, headcountLabels } from "@/lib/company-profile";
import { compactEur, diligenceChecks, healthSignals, registryForRole, reportFlags, reportSummary, type ReportRole } from "@/lib/company-report";
import {
  figureVeilBalance,
  figureVeilCapital,
  figureVeilChartBalance,
  figureVeilChartIncome,
  figureVeilClient,
  figureVeilProduct,
} from "@/lib/figure-veil";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import { formatEur, recoveryYears } from "@/lib/money";
import { pnlWaterfall, sabiOwnershipSlices, type SabiYear } from "@/lib/sabi/insights";
import { formatHolderName } from "@/lib/sabi/holders";
import type { SabiHolding } from "@/lib/sabi/parse";
import type { SabiRegistry } from "@/lib/sabi/registry";

/**
 * t69: the single company report every role reads (admin, seller preview, buyer, advisor). One ordered story:
 * summary → business → numbers → health → ownership → team → deal → raw detail. Figures stay behind the
 * existing lock for buyers; registry identities (people, shareholders, banks) only reach admin and seller.
 */
export const companyReportCopy = {
  nav: "Ir a",
  summary: "Resumen",
  summaryHint: "Lo esencial de un vistazo. Las frases y alertas salen solo de las cuentas que hay en la ficha.",
  business: "Negocio",
  evolution: "Evolución financiera",
  evolutionHint: "Cómo han ido ingresos y resultados año a año.",
  profitability: "Rentabilidad",
  profitabilityHint: "Cuánto beneficio saca la empresa de lo que vende, de lo que tiene y del dinero de los socios.",
  health: "Solidez financiera",
  healthHint: "Semáforos de deuda y liquidez: verde es holgado, ámbar conviene revisarlo y rojo es una señal de riesgo.",
  healthAll: "Ver todos los indicadores de deuda y liquidez",
  balance: "Balance",
  balanceHint: "Lo que tiene la empresa (activo) frente a cómo lo financia (fondos propios y deudas).",
  ownership: "Propiedad y gobierno",
  ownershipHint: "Quién es dueño de la empresa y quién la dirige.",
  team: "Equipo",
  deal: "Operación de venta",
  dealHint: "Precio pedido y lo que supone frente a lo que genera la empresa.",
  detail: "Detalle de cuentas",
  detailHint: "Todas las cifras en tabla, para quien quiera revisarlas línea a línea.",
  highlights: "Puntos fuertes y a vigilar",
  noYears: "Aún no hay ejercicios cerrados en la ficha.",
};

const privateIcons: Record<string, typeof Building2> = {
  legal: Building2,
  cif: Receipt,
  address: Map,
  owner: Users,
  email: Mail,
  phone: Phone,
  nid: IdCard,
  created: CalendarDays,
};

type VeilKind = "mix" | "capital" | "income" | "balance";

function ReportSection({
  id,
  icon: Icon,
  title,
  intro,
  aside,
  open = true,
  children,
}: {
  id: string;
  icon: typeof Building2;
  title: string;
  intro?: string;
  aside?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} id={id} className="group/section scroll-mt-24 rounded-2xl border border-[#e6e9f0] bg-white shadow-[0_1px_2px_rgba(28,39,64,0.04)]">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-4 outline-none hover:bg-[#fafbfc] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f4f2] text-[#0f766e]">
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="min-w-0 flex-1 text-lg font-semibold text-[#1c2740]">{title}</h2>
        {aside ? <span className="hidden truncate text-sm text-[#5c6b78] sm:block">{aside}</span> : null}
        <ChevronDown className="size-5 shrink-0 text-[#5c6b78] transition-transform group-open/section:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-[#eef0f4] px-4 pt-4 pb-5 sm:px-6 sm:pb-6">
        {intro ? <p className="mb-4 text-sm leading-6 text-[#5c6b78]">{intro}</p> : null}
        {children}
      </div>
    </details>
  );
}

function LockedFigures({ open, kind, note, action = null, children }: { open: boolean; kind: VeilKind; note: string; action?: ReactNode; children: ReactNode }) {
  if (open) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-md" aria-hidden>
        <FigureVeil kind={kind} />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto z-10 flex flex-col items-center gap-3 px-6 text-center">
          <EyeOff className="size-5 text-[#0f766e]" aria-hidden />
          <p className="max-w-md rounded-2xl bg-white/85 px-4 py-3 text-sm font-medium text-[#1c2740]">{note}</p>
          {isValidElement(action) ? cloneElement(action) : action}
        </div>
      </div>
    </div>
  );
}

function FigureVeil({ kind }: { kind: VeilKind }) {
  if (kind === "mix") {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
        <ShareDonut title={companyCopy.chartProduct} slices={figureVeilProduct} palette="product" />
        <ShareDonut title={companyCopy.chartClient} slices={figureVeilClient} palette="client" />
      </div>
    );
  }

  if (kind === "capital") {
    return <ShareDonut title={companyCopy.chartCapital} slices={figureVeilCapital} palette="capital" />;
  }

  const chart = kind === "income" ? figureVeilChartIncome() : figureVeilChartBalance();
  if (kind === "income") {
    return <ProfileIncomeChart years={chart.years} rows={chart.rows} />;
  }

  const balance = figureVeilBalance();
  return (
    <div>
      <FinancialTable years={balance.years} rows={balance.rows} />
      <ProfileBalanceChart years={chart.years} rows={chart.rows} />
    </div>
  );
}

type FigureSource = "seller" | "sabi" | "calc";
const sourceBadge: Record<FigureSource, { label: string; className: string }> = {
  seller: { label: "Vendedor", className: "bg-[#eef0f4] text-[#3d4a63]" },
  sabi: { label: "Cuentas anuales", className: "bg-[#e6f4f2] text-[#0f5f59]" },
  calc: { label: "Calculado", className: "bg-[#f4f6f9] text-[#5c6b78]" },
};

function SourceBadge({ source }: { source: FigureSource }) {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] leading-3 font-semibold whitespace-nowrap ${sourceBadge[source].className}`}>{sourceBadge[source].label}</span>;
}

function Kpi({
  label,
  value,
  hint,
  sub,
  tone = "ink",
  source,
}: {
  label: string;
  value: string;
  hint: string;
  sub?: ReactNode;
  tone?: "ink" | "loss" | "pending";
  source?: FigureSource;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-[#e7eaee] bg-white p-3 sm:p-4">
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs leading-4 font-medium text-[#5c6b78]">{label}</span>
        <span className="flex shrink-0 items-center gap-1">
          {source ? <SourceBadge source={source} /> : null}
          <FieldHint text={hint} align="end" wide />
        </span>
      </div>
      <span className={`mt-1.5 text-lg font-semibold tabular-nums sm:text-xl ${tone === "loss" ? "text-[#a12f2f]" : tone === "pending" ? "text-[#8b95a7]" : "text-[#1c2740]"}`}>{value}</span>
      {sub ? <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#8b95a7]">{sub}</div> : null}
    </div>
  );
}

function Fact({ icon: Icon, label, value, source, note }: { icon: typeof Building2; label: string; value: string; source?: FigureSource; note?: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-[#f7f8fb] p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-[#0f766e]" aria-hidden />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-[#5c6b78]">
          {label}
          {source ? <SourceBadge source={source} /> : null}
        </span>
        <span className="block text-sm font-semibold break-words text-[#1c2740]">{value}</span>
        {note ? <span className="mt-0.5 block text-[11px] leading-4 text-[#8b95a7]">{note}</span> : null}
      </span>
    </div>
  );
}

/** t70: what the company does: seller text first, then the registry activity (admin), then the CNAE titles. Null hides the line. */
function businessAbout(project: InvestorProjectProfile, registryActivity: string | null): { text: string; source: string | null } | null {
  const own = project.description?.trim();
  if (own) {
    return { text: own, source: null };
  }

  const registry = registryActivity?.trim();
  if (registry) {
    return { text: registryText(registry), source: "Descripción por defecto: es la actividad que consta en el registro mercantil. El vendedor aún no ha escrito la suya." };
  }

  const titles = [project.principalCnae, ...project.secondaryCnaes].flatMap((cnae) => (cnae?.title ? [cnae.title] : []));
  if (titles.length > 0) {
    return { text: `${titles[0]}${titles.length > 1 ? `; también ${titles.slice(1).join("; ").toLowerCase()}` : ""}.`, source: "Descripción por defecto: sale de los códigos CNAE de la empresa. El vendedor aún no ha escrito la suya." };
  }

  return null;
}

/** t70: one plain sentence about the last year with headcount data. Only real values; null when there is nothing to say. */
function teamSummary(years: SabiYear[], staff: Metric[]): string | null {
  const index = years.findLastIndex((year) => year.employees !== null && year.employees > 0);
  if (index < 0) {
    return null;
  }
  const at = (key: string) => staff.find((metric) => metric.key === key)?.values[index] ?? null;
  const parts = [`En ${yearLabel(years[index]!)} la empresa tenía ${formatValue(years[index]!.employees!, "people")} empleados de media`];
  const revenue = at("revenuePerEmployee");
  const cost = at("averageStaffCost");
  const share = at("staffCostToRevenue");
  if (revenue !== null) {
    parts.push(`cada uno generaba ${formatValue(revenue, "keur")} de ingresos`);
  }
  if (cost !== null) {
    parts.push(`y costaba ${formatValue(cost, "keur")}`);
  }
  const sentence = `${parts.join(", ").replace(", y costaba", " y costaba")}.`;
  return share !== null ? `${sentence} Los gastos de personal suponían el ${formatValue(share, "pct")} de los ingresos.` : sentence;
}

/** t70: how to read the deal block. Price, reason and adjustments come from the seller; the multiple is computed when price and a positive EBITDA exist. */
function dealReading(project: InvestorProjectProfile, hasSabi: boolean) {
  const priceSet = project.askingPriceCents > 0;
  const adjustedSet = project.adjustedEbitdaCents !== 0 || project.ebitdaCents === 0;
  const multiple = recoveryYears(project.askingPriceCents, project.ebitdaCents);
  const adjustedMultiple = adjustedSet ? recoveryYears(project.askingPriceCents, project.adjustedEbitdaCents) : null;
  const fmt = (value: number) => `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })}x`;
  const salesMultiple = priceSet && project.revenueCents > 0 ? project.askingPriceCents / project.revenueCents : null;

  let multipleText: string;
  let multipleNote: string | null = null;
  if (!priceSet) {
    multipleText = "Pendiente";
    multipleNote = "Falta el precio del vendedor";
  } else if (multiple !== null) {
    multipleText = fmt(multiple);
    multipleNote = adjustedMultiple !== null && Math.abs(adjustedMultiple - multiple) >= 0.05 ? `${fmt(adjustedMultiple)} sobre EBITDA ajustado` : null;
  } else if (adjustedMultiple !== null) {
    multipleText = `${fmt(adjustedMultiple)} ajust.`;
    multipleNote = "EBITDA contable negativo; calculado sobre el EBITDA ajustado";
  } else {
    multipleText = "No aplica";
    multipleNote = `EBITDA negativo${salesMultiple !== null ? `; precio / ventas ${fmt(salesMultiple)}` : ""}`;
  }

  return {
    priceSet,
    adjustedSet,
    multipleText,
    multipleNote,
    adjustedNote: adjustedSet ? null : "El vendedor aún no ha indicado ajustes (gastos no recurrentes, sueldos de socios…).",
    figuresSource: (hasSabi ? "sabi" : "seller") as FigureSource,
  };
}

function saleReasonText(reason: string | null): string {
  return reason && saleReasons.includes(reason as (typeof saleReasons)[number]) ? saleReasonLabels[reason as (typeof saleReasons)[number]] : "Pendiente del vendedor";
}

function lastValue(years: SabiYear[], pick: (year: SabiYear) => number | null): { year: SabiYear; value: number } | null {
  for (let index = years.length - 1; index >= 0; index -= 1) {
    const value = pick(years[index]!);
    if (value !== null) {
      return { year: years[index]!, value };
    }
  }

  return null;
}

/** t76: one shareholders module for admin and seller: table on the left, donut on the right in wide containers, stacked when narrow. */
export function ShareholdersPanel({ holdings }: { holdings: SabiHolding[] }) {
  const rows = holdings.map((holder) => ({ ...holder, name: formatHolderName(holder.name) }));
  const slices = sabiOwnershipSlices(rows);
  return (
    <Section
      icon={<Users className="size-4 text-[#0f766e]" aria-hidden />}
      title="Accionistas"
      count={holdings.length}
      hint={"Según el registro mercantil. \u201c> 50 %\u201d significa que solo consta que supera el 50 %."}
    >
      <div className="@container">
        <div className={`grid items-start gap-4 ${slices.length > 0 ? "@3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]" : ""}`}>
          <ShareholderTable rows={rows} />
          {slices.length > 0 ? (
            <div className="min-w-0 [&>section]:h-auto">
              <ShareDonut title="Reparto del capital" slices={slices} palette="capital" />
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

/** Registry blocks (identities): ownership, directors, subsidiaries, audits, banks and activity codes. */
export function RegistryOverview({ registry }: { registry: SabiRegistry }) {
  const directors = new Set(registry.directors.map((person) => person.name)).size;
  return (
    <div className="flex flex-col gap-4">
      {registry.shareholdings.length > 0 ? <ShareholdersPanel holdings={registry.shareholdings} /> : null}
      {directors > 0 ? (
        <Section icon={<Users className="size-4 text-[#0f766e]" aria-hidden />} title="Administradores y directivos" count={directors}>
          <People directors={registry.directors} />
        </Section>
      ) : null}
      {registry.subsidiaries.length > 0 ? (
        <Section icon={<Building2 className="size-4 text-[#0f766e]" aria-hidden />} title="Participadas" count={registry.subsidiaries.length} hint={"Sociedades en las que la empresa tiene participación, con el % directo y total publicado en el registro.\nPara el comprador importan por el perímetro (qué entra en la compra), si las cuentas son individuales o consolidadas y los préstamos o garantías entre sociedades del grupo."}>
          {/* t71: compact list (first 3); the full detail stays one click away. */}
          <ul className="divide-y divide-[#eef0f4] text-sm">
            {registry.subsidiaries.slice(0, 3).map((holding, index) => (
              <li key={`${holding.name}-${index}`} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate text-[#1c2740]">
                  {holding.name}
                  {holding.country ? <span className="ml-1.5 text-[11px] text-[#8b95a7]">{holding.country}</span> : null}
                </span>
                {(holding.direct ?? holding.total) ? <span className="shrink-0 text-xs font-semibold text-[#0f5f59] tabular-nums">{holding.direct ?? holding.total} %</span> : null}
              </li>
            ))}
          </ul>
          <Toggle label={registry.subsidiaries.length > 3 ? `Ver las ${registry.subsidiaries.length} participadas` : "Ver detalle"}>
            <HoldingTable rows={registry.subsidiaries} />
          </Toggle>
        </Section>
      ) : null}
      <RegistryRecords registry={registry} />
    </div>
  );
}

function RegistryRecords({ registry }: { registry: SabiRegistry }) {
  const schemes = Object.entries(registry.activityCodes).filter(([, set]) => set && set.primary.length + set.secondary.length > 0);
  if (registry.audits.length === 0 && registry.banks.length === 0 && schemes.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {registry.audits.length > 0 ? (
        <Section icon={<ShieldCheck className="size-4 text-[#0f766e]" aria-hidden />} title="Auditoría por ejercicio" count={registry.audits.length}>
          <ol className="relative ml-1.5 border-l border-[#d5dbe3]">
            {[...registry.audits]
              .sort((a, b) => b.year - a.year)
              .map((audit) => (
                <li key={audit.year} className="relative pb-3 pl-4 last:pb-0">
                  <span className="absolute top-1 -left-[5px] size-2.5 rounded-full bg-[#0f766e]" aria-hidden />
                  <p className="text-sm font-medium text-[#1c2740] tabular-nums">
                    {audit.year} <span className="text-xs font-normal text-[#5c6b78]">· cierre {isoDay(audit.closingOn)}</span>
                  </p>
                  <p className="text-xs text-[#5c6b78]">{[audit.opinion, audit.auditorName, audit.auditorCode].filter(Boolean).join(" · ") || "Sin datos de auditoría"}</p>
                </li>
              ))}
          </ol>
        </Section>
      ) : null}
      {registry.banks.length > 0 ? (
        <Section icon={<Landmark className="size-4 text-[#0f766e]" aria-hidden />} title="Bancos" count={registry.banks.length}>
          <ul className="flex flex-wrap gap-1.5">
            {registry.banks.map((bank) => (
              <li key={bank} className="rounded-lg bg-[#f7f8fb] px-2.5 py-1.5 text-xs font-medium text-[#1c2740]">
                {bank}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {schemes.length > 0 ? (
        <Section icon={<Tags className="size-4 text-[#0f766e]" aria-hidden />} title="Códigos de actividad">
          <dl className="flex flex-col gap-3 text-sm">
            {schemes.map(([scheme, set]) => (
              <div key={scheme} className="min-w-0">
                <dt className="text-xs font-medium text-[#5c6b78]">{schemeLabels[scheme] ?? scheme.toUpperCase()}</dt>
                <dd className="text-[#1c2740]">
                  {[...set!.primary.map((code) => ({ ...code, main: true })), ...set!.secondary.map((code) => ({ ...code, main: false }))].map((code, index) => (
                    <span key={`${code.code}-${index}`} className="block">
                      <span className="font-medium tabular-nums">{code.code}</span> {code.description}
                      {code.main ? <span className="ml-1 text-xs text-[#0f766e]">principal</span> : null}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}
    </div>
  );
}

export function CompanyReport({
  project,
  role,
  figuresOpen = true,
  lockedNote = companyCopy.figuresLocked,
  lockAction = null,
  registry: fullRegistry = null,
  privateFacts = null,
  privateHeading = "",
  adminDetail = null,
  registryActivity = null,
}: {
  project: InvestorProjectProfile;
  role: ReportRole;
  figuresOpen?: boolean;
  lockedNote?: string;
  lockAction?: ReactNode;
  registry?: SabiRegistry | null;
  privateFacts?: { key: string; label: string; value: string }[] | null;
  privateHeading?: string;
  adminDetail?: ReactNode;
  /** t70: SABI "actividad" text. Shown to admin only (free text from the registry can name the company). */
  registryActivity?: string | null;
}) {
  const registry = registryForRole(fullRegistry, role);
  const facts = role === "admin" ? privateFacts : null;
  const years = (project.reportYears ?? []).filter((year) => year.revenueCents !== null || year.ebitdaCents !== null || year.totalAssetsCents !== null);
  const hasYears = years.length > 0;
  const lock = (kind: VeilKind, children: ReactNode) => (
    <LockedFigures open={figuresOpen} kind={kind} note={lockedNote} action={lockAction}>
      {children}
    </LockedFigures>
  );

  const multiple = recoveryYears(project.askingPriceCents, project.ebitdaCents);
  const margin = project.ebitdaMarginBp === null ? companyCopy.unavailable : formatBasisPoints(project.ebitdaMarginBp);
  const lastEmployees = lastValue(years, (year) => year.employees);
  const age = project.foundedYear !== null ? new Date().getFullYear() - project.foundedYear : null;
  const summary = figuresOpen ? reportSummary(years) : [];
  const flags = figuresOpen ? reportFlags(years) : [];
  const signals = healthSignals(years);
  const { kpis, debt } = metrics(years);
  const profitability = kpis.filter((metric) => ["ebitdaMargin", "profitMargin", "economicReturn", "financialReturn"].includes(metric.key));
  const profitabilityColors: Record<string, string> = { ebitdaMargin: teal, profitMargin: tealLight, economicReturn: navy, financialReturn: tealMid };
  const profitabilityTrend: Series[] = profitability
    .filter((metric) => metric.key === "economicReturn" || metric.key === "financialReturn" || !profitability.some((item) => item.key === "economicReturn" || item.key === "financialReturn"))
    .map((metric) => ({ label: metric.label, color: profitabilityColors[metric.key] ?? navy, values: metric.values }));
  const staff = kpis.filter((metric) => ["revenuePerEmployee", "averageStaffCost", "staffCostToRevenue"].includes(metric.key));
  const employees = years.map((year) => year.employees);
  const employeesMetric: Metric = { key: "employees", label: "Empleados", unit: "people", better: "none", values: employees, hint: "Plantilla media declarada en las cuentas del ejercicio.\nFuente: cuentas anuales." };
  const teamTiles = [employeesMetric, ...["revenuePerEmployee", "averageStaffCost", "staffCostToRevenue"].flatMap((key) => staff.filter((metric) => metric.key === key))].filter((metric) =>
    metric.values.some((value) => value !== null),
  );
  const productivity: Series[] = [
    { label: "Ingresos por empleado", color: navy, values: staff.find((metric) => metric.key === "revenuePerEmployee")?.values ?? [] },
    { label: "Coste por empleado", color: teal, values: staff.find((metric) => metric.key === "averageStaffCost")?.values ?? [] },
  ].filter((item) => item.values.some((value) => value !== null));
  const teamSentence = teamSummary(years, staff);
  const latest = [...years].reverse().find((year) => pnlWaterfall(year).length > 0) ?? null;
  const trend: Series[] = [
    { label: "Ingresos", color: navy, values: years.map((year) => year.revenueCents) },
    { label: "EBITDA", color: teal, values: years.map((year) => year.ebitdaCents) },
    { label: "Resultado del ejercicio", color: tealLight, values: years.map((year) => year.netResultCents) },
  ].filter((item) => item.values.some((value) => value !== null));
  // t71: years with negligible revenue get n/s instead of a -13.459 % margin.
  const margins: Array<Series & { ns: boolean[] }> = [
    { label: "Margen EBITDA", color: teal, ...reportMargins(years, (year) => year.ebitdaCents) },
    { label: "Margen neto", color: navy, ...reportMargins(years, (year) => year.netResultCents) },
  ].filter((item) => item.values.some((value) => value !== null));
  const hasBalanceYears = years.some((year) => year.totalAssetsCents !== null && year.totalAssetsCents > 0);
  const latestBalance = lastValue(years, (year) => (year.totalAssetsCents !== null && year.totalAssetsCents > 0 ? year.totalAssetsCents : null));
  const ownership = registry ? sabiOwnershipSlices(registry.shareholdings) : [];
  const capital = ownership.length > 0 ? ownership : project.capital;
  const governance = registry && (registry.shareholdings.length > 0 || registry.directors.length > 0 || registry.subsidiaries.length > 0);
  const detailRows = project.detailRows ?? [];
  const indicatorRows = project.indicatorRows ?? [];
  const legalFacts = [
    project.legalForm ? { label: companyCopy.legalFormLabel, value: project.legalForm } : null,
    // t72: the accounts format (e.g. "Abreviado PGC 2007") left Negocio for everyone; admins see it as a footnote in Detalle de cuentas.
    project.audited === true ? { label: companyCopy.auditedLabel, value: companyCopy.auditedYes } : null,
  ].flatMap((fact) => (fact ? [fact] : []));
  const about = businessAbout(project, role === "admin" ? registryActivity : null);
  const adjustment = project.adjustedEbitdaCents - project.ebitdaCents;
  const yieldPct = project.askingPriceCents > 0 && project.ebitdaCents > 0 ? (project.ebitdaCents / project.askingPriceCents) * 100 : null;
  const composition = balanceComposition(years);
  const checks = diligenceChecks(years, fullRegistry?.audits ?? [], project.audited === true);
  const deal = dealReading(project, years.length > 0);

  const sections = [
    { id: "resumen", label: companyReportCopy.summary },
    { id: "negocio", label: companyReportCopy.business },
    { id: "evolucion", label: companyReportCopy.evolution },
    profitability.length > 0 ? { id: "rentabilidad", label: companyReportCopy.profitability } : null,
    signals.length > 0 || debt.length > 0 ? { id: "solidez", label: companyReportCopy.health } : null,
    { id: "balance", label: companyReportCopy.balance },
    capital.length > 0 || governance ? { id: "propiedad", label: companyReportCopy.ownership } : null,
    { id: "equipo", label: companyReportCopy.team },
    { id: "operacion", label: companyReportCopy.deal },
    checks.length > 0 ? { id: "revision", label: "Revisión" } : null,
    { id: "detalle", label: companyReportCopy.detail },
  ].flatMap((item) => (item ? [item] : []));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ReportNav items={sections} label={companyReportCopy.nav} />

      <ReportSection id="resumen" icon={Sparkles} title={companyReportCopy.summary} intro={companyReportCopy.summaryHint}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <Kpi label={companyCopy.revenueLabel} value={compactEur(project.revenueCents)} hint={`Ingresos del último ejercicio de referencia: ${formatEur(project.revenueCents)}.`} />
          <Kpi label={companyCopy.ebitdaLabel} value={compactEur(project.ebitdaCents)} tone={project.ebitdaCents < 0 ? "loss" : "ink"} hint={`Resultado de explotación antes de amortizaciones, intereses e impuestos: ${formatEur(project.ebitdaCents)}. Es la caja que genera el negocio.`} sub={<span>Margen {margin}</span>} />
          <Kpi
            label={companyCopy.askingPriceLabel}
            value={project.askingPriceCents > 0 ? compactEur(project.askingPriceCents) : "Pendiente"}
            tone={project.askingPriceCents > 0 ? "ink" : "pending"}
            hint={project.askingPriceCents > 0 ? `Precio que pide el vendedor: ${formatEur(project.askingPriceCents)}.` : "El vendedor aún no ha indicado precio. El registro no lo publica."}
            sub={multiple !== null ? <RoiChip years={multiple} /> : project.askingPriceCents > 0 ? null : <span>Pendiente de que el vendedor indique precio</span>}
          />
          <Kpi
            label={lastEmployees ? "Empleados" : companyCopy.workersLabel}
            value={lastEmployees ? String(lastEmployees.value) : project.headcountRange ? headcountLabels[project.headcountRange] : companyCopy.unavailable}
            hint={lastEmployees ? "Plantilla media declarada en las últimas cuentas." : "Tramo de plantilla indicado por el vendedor."}
            sub={age !== null ? <span>{age} años de actividad (desde {project.foundedYear})</span> : null}
          />
        </div>
        {facts && facts.length > 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#c9d0da] bg-[#fafbfc] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1c2740]">
              <EyeOff className="size-4 text-[#0f766e]" aria-hidden />
              {privateHeading}
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {facts.map((fact) => (
                <Fact key={fact.key} icon={privateIcons[fact.key] ?? Building2} label={fact.label} value={fact.value} />
              ))}
            </div>
          </div>
        ) : null}
        {summary.length > 0 || flags.length > 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {summary.length > 0 ? (
              <div className="rounded-xl bg-[#f3faf9] p-4">
                <h3 className="text-sm font-semibold text-[#1c2740]">En pocas palabras</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-6 text-[#3d4a63]">
                  {summary.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#0f766e]" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {flags.length > 0 ? (
              <div className="rounded-xl border border-[#e7eaee] p-4">
                <h3 className="text-sm font-semibold text-[#1c2740]">{companyReportCopy.highlights}</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {flags.map((flag) => (
                    <li key={flag.text} className="flex items-start gap-2 text-[#1c2740]">
                      {flag.level === "good" ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#0f766e]" aria-label="A favor" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#c27c0e]" aria-label="A vigilar" />}
                      {flag.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {!figuresOpen ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#f7f8fb] px-4 py-3 text-sm text-[#3d4a63]">
            <EyeOff className="size-4 shrink-0 text-[#0f766e]" aria-hidden />
            {lockedNote}
          </p>
        ) : null}
      </ReportSection>

      <ReportSection id="negocio" icon={Briefcase} title={companyReportCopy.business} aside={project.principalCnae?.title}>
        {about ? (
          <p className="leading-7 text-[#1c2740]">
            {about.text}
            {about.source ? (
              <span className="ml-1.5 inline-flex align-middle">
                <InfoHint text={about.source} icon="warning" tone="warning" width="lg" />
              </span>
            ) : null}
          </p>
        ) : null}
        <div className={`${about ? "mt-4 " : ""}grid gap-2 sm:grid-cols-2 xl:grid-cols-4`}>
          {project.region ? <Fact icon={Map} label={companyCopy.regionLabel} value={project.region} /> : null}
          {project.foundedYear !== null ? <Fact icon={CalendarDays} label={companyCopy.foundedYearLabel} value={String(project.foundedYear)} /> : null}
          {legalFacts.map((fact) => (
            <Fact key={fact.label} icon={FileCheck2} label={fact.label} value={fact.value} />
          ))}
        </div>
        {project.principalCnae || project.secondaryCnaes.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#5c6b78]">Sector</span>
            {project.principalCnae ? (
              <span className="rounded-full bg-[#1c2740] px-3 py-1 text-xs font-medium text-white">
                {project.principalCnae.code} · {project.principalCnae.title}
              </span>
          ) : null}
          {project.secondaryCnaes.map((cnae) => (
            <span key={cnae.code} className="rounded-full bg-[#eef0f4] px-3 py-1 text-xs text-[#1c2740]">
              {cnae.code} · {cnae.title}
            </span>
          ))}
        </div>
        ) : null}
        <h3 className="mt-6 mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#1c2740]">
          Qué vende y a quién
          <FieldHint text={companyCopy.structureHint} wide />
        </h3>
        {lock(
          "mix",
          <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
            <ShareDonut title={companyCopy.chartProduct} slices={project.products} palette="product" />
            {project.customerBase === "consumer" ? (
              <section className="flex h-full flex-col gap-3 rounded-xl bg-[#f4f7ff] p-4">
                <h3 className="text-sm font-semibold text-[#1c2740]">{companyCopy.chartClient}</h3>
                <p className="text-sm leading-6 text-[#5c6b78]">{companyCopy.customerConsumerPublic}</p>
              </section>
            ) : (
              <ShareDonut title={companyCopy.chartClient} slices={project.clients} palette="client" />
            )}
          </div>,
        )}
      </ReportSection>

      <ReportSection id="evolucion" icon={TrendingUp} title={companyReportCopy.evolution} intro={companyReportCopy.evolutionHint}>
        {lock(
          "income",
          hasYears && trend.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <ChartBox
                  title="Ingresos y resultados"
                  hint="Ingresos, EBITDA (resultado antes de amortizaciones, intereses e impuestos) y resultado final de cada ejercicio. Por debajo de la línea son pérdidas."
                  legend={trend.map((item) => (
                    <LegendDot key={item.label} color={item.color} label={item.label} />
                  ))}
                  table={<YearTable years={years} rows={trend.map((item) => ({ label: item.label, unit: "eur", values: item.values }))} />}
                >
                  <ColumnBars years={years} series={trend} unit="eur" />
                </ChartBox>
                {margins.length > 0 ? (
                  <ChartBox
                    title="Márgenes"
                    hint={"Margen EBITDA = EBITDA ÷ ingresos.\nMargen neto = resultado del ejercicio ÷ ingresos.\nCuánto de cada euro vendido se convierte en beneficio."}
                    legend={margins.map((item) => (
                      <LegendDot key={item.label} color={item.color} label={item.label} />
                    ))}
                    table={<YearTable years={years} rows={margins.map((item) => ({ label: item.label, unit: "pct", values: item.values, ns: item.ns }))} />}
                  >
                    <LineChart years={years} series={margins} unit="pct" />
                  </ChartBox>
                ) : null}
              </div>
              {latest ? (
                <ChartBox
                  title="De ingresos a resultado"
                  hint={"Cascada del ejercicio elegido: parte de los ingresos, suma o resta cada partida y llega al resultado final.\nAl lado de cada importe, su peso sobre los ingresos de ese año."}
                >
                  <Waterfall years={years} />
                </ChartBox>
              ) : null}
            </div>
          ) : project.incomeYears.length > 0 ? (
            <ProfileIncomeChart years={project.incomeYears} rows={project.incomeRows} />
          ) : (
            <Empty text={companyReportCopy.noYears} />
          ),
        )}
      </ReportSection>

      {profitability.length > 0 ? (
        <ReportSection id="rentabilidad" icon={LineChartIcon} title={companyReportCopy.profitability} intro={companyReportCopy.profitabilityHint}>
          {lock(
            "balance",
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {profitability.map((metric) => (
                  <KpiTile key={metric.key} metric={metric} years={years} />
                ))}
              </div>
              {/* t71: the full multi-year evolution, not only the last year on the tiles. */}
              <ChartBox
                title="Evolución de la rentabilidad"
                hint={"Todos los ejercicios disponibles.\nROA = resultado antes de impuestos ÷ total activo.\nROE = resultado antes de impuestos ÷ fondos propios.\nLa tabla añade los márgenes."}
                legend={profitabilityTrend.map((item) => (
                  <LegendDot key={item.label} color={item.color} label={item.label} />
                ))}
                table={<YearTable years={years} rows={profitability.map((metric) => ({ label: metric.label, unit: metric.unit, values: metric.values, ns: metric.ns }))} />}
              >
                <LineChart years={years} series={profitabilityTrend} unit="pct" />
              </ChartBox>
            </div>,
          )}
        </ReportSection>
      ) : null}

      {signals.length > 0 || debt.length > 0 ? (
        <ReportSection id="solidez" icon={ShieldCheck} title={companyReportCopy.health} intro={companyReportCopy.healthHint}>
          {lock(
            "balance",
            <div className="flex flex-col gap-4">
              {signals.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {signals.map((signal) => (
                    <SignalGauge key={signal.key} signal={signal} />
                  ))}
                </div>
              ) : null}
              {debt.length > 0 ? (
                <details className="group/all rounded-xl border border-[#e7eaee]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-[#0f766e] [&::-webkit-details-marker]:hidden">
                    {companyReportCopy.healthAll}
                    <ChevronDown className="size-4 transition-transform group-open/all:rotate-180" aria-hidden />
                  </summary>
                  <div className="grid grid-cols-2 gap-2 border-t border-[#eef0f4] p-3 md:grid-cols-3 xl:grid-cols-4">
                    {debt.map((metric) => (
                      <KpiTile key={metric.key} metric={metric} years={years} />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>,
          )}
        </ReportSection>
      ) : null}

      <ReportSection id="balance" icon={Scale} title={companyReportCopy.balance} intro={companyReportCopy.balanceHint}>
        {lock(
          "balance",
          hasBalanceYears ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
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
              {latestBalance ? <BalanceReading year={latestBalance.year} /> : null}
            </div>
          ) : project.balanceYears.length > 0 ? (
            <ProfileBalanceChart years={project.balanceYears} rows={project.balanceRows} />
          ) : (
            <Empty text={companyReportCopy.noYears} />
          ),
        )}
      </ReportSection>

      {capital.length > 0 || governance ? (
        <ReportSection id="propiedad" icon={PieChart} title={companyReportCopy.ownership} intro={companyReportCopy.ownershipHint}>
          <div className="flex flex-col gap-4">
            {capital.length > 0 && !(registry && registry.shareholdings.length > 0) ? lock("capital", <div className="[&>section]:h-auto"><ShareDonut title={companyCopy.chartCapital} slices={capital} palette="capital" /></div>) : null}
            {registry ? (
              <RegistryOverview registry={{ ...registry, audits: [], banks: [], activityCodes: {} }} />
            ) : null}
          </div>
        </ReportSection>
      ) : null}

      <ReportSection id="equipo" icon={Users} title={companyReportCopy.team} aside={project.headcountRange ? headcountLabels[project.headcountRange] : undefined}>
        {employees.some((value) => value !== null) || staff.length > 0 ? (
          lock(
            "balance",
            <div className="flex flex-col gap-4">
              {teamTiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                  {teamTiles.map((metric) => (
                    <KpiTile key={metric.key} metric={metric} years={years} />
                  ))}
                </div>
              ) : null}
              {teamSentence ? <p className="text-sm leading-6 text-[#3d4a63]">{teamSentence}</p> : null}
              <div className="grid gap-4 lg:grid-cols-2">
                {employees.some((value) => value !== null) ? (
                  <ChartBox title="Plantilla media" hint="Empleados declarados en las cuentas de cada ejercicio." table={<YearTable years={years} rows={[{ label: "Empleados", unit: "people", values: employees }]} />}>
                    <ColumnBars years={years} series={[{ label: "Empleados", color: teal, values: employees }]} unit="people" />
                  </ChartBox>
                ) : null}
                {productivity.length > 0 ? (
                  <ChartBox
                    title="Ingresos frente a coste por empleado"
                    hint={"Miles de euros por empleado y año. Si la línea de ingresos se acerca a la de coste, casi todo lo que se factura se va en sueldos.\nFuente: cuentas anuales (ingresos ÷ empleados y gastos de personal ÷ empleados)."}
                    legend={productivity.map((item) => <LegendDot key={item.label} color={item.color} label={item.label} />)}
                    table={<YearTable years={years} rows={productivity.map((item) => ({ label: item.label, unit: "keur", values: item.values }))} />}
                  >
                    <LineChart years={years} series={productivity} unit="keur" />
                  </ChartBox>
                ) : null}
              </div>
            </div>,
          )
        ) : (
          <Fact icon={Users} label={companyCopy.workersLabel} value={project.headcountRange ? headcountLabels[project.headcountRange] : companyCopy.unavailable} />
        )}
      </ReportSection>

      <ReportSection id="operacion" icon={HandCoins} title={companyReportCopy.deal} intro={companyReportCopy.dealHint}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <Kpi
            label={companyCopy.askingPriceLabel}
            value={deal.priceSet ? formatEur(project.askingPriceCents) : "Pendiente"}
            tone={deal.priceSet ? "ink" : "pending"}
            source="seller"
            hint="Precio que pide el vendedor por la empresa. No sale del registro: lo indica el vendedor."
            sub={deal.priceSet ? null : <span>Pendiente de que el vendedor indique precio</span>}
          />
          <Kpi
            label="Múltiplo de EBITDA"
            value={deal.multipleText}
            tone={multiple !== null ? "ink" : "pending"}
            source="calc"
            hint={"Precio ÷ EBITDA: cuántos años del EBITDA actual equivale el precio. También son los años para recuperar la compra si el EBITDA se mantuviera.\nSolo se calcula con precio y EBITDA positivos."}
            sub={
              <>
                {multiple !== null ? <RoiChip years={multiple} /> : null}
                {deal.multipleNote ? <span>{deal.multipleNote}</span> : null}
              </>
            }
          />
          <Kpi
            label="Rentabilidad sobre el precio"
            value={yieldPct !== null ? `${yieldPct.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %` : deal.priceSet ? "No aplica" : "Pendiente"}
            tone={yieldPct !== null ? "ink" : "pending"}
            source="calc"
            hint="EBITDA ÷ precio × 100: lo que el negocio genera cada año por cada 100 € pagados, antes de impuestos e intereses."
            sub={yieldPct === null ? <span>{deal.priceSet ? "EBITDA negativo" : "Falta el precio"}</span> : null}
          />
          <Kpi
            label={companyCopy.saleReasonLabel}
            value={saleReasonText(project.saleReason)}
            tone={project.saleReason ? "ink" : "pending"}
            source="seller"
            hint="Motivo de venta indicado por el vendedor. El registro no lo publica."
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Fact icon={Receipt} label={companyCopy.ebitdaLabel} value={formatEur(project.ebitdaCents)} source={deal.figuresSource} />
          <Fact
            icon={Receipt}
            label={companyCopy.adjustedEbitdaLabel}
            value={deal.adjustedSet ? `${formatEur(project.adjustedEbitdaCents)}${adjustment !== 0 ? ` (${adjustment > 0 ? "+" : ""}${compactEur(adjustment)} de ajustes)` : ""}` : "Pendiente del vendedor"}
            source="seller"
            note={deal.adjustedNote ?? undefined}
          />
          {project.opexCents !== null ? <Fact icon={Receipt} label={companyCopy.opexLabel} value={formatEur(project.opexCents)} source={deal.figuresSource} /> : null}
        </div>
        <p className="mt-4 text-xs leading-5 text-[#5c6b78]">
          El registro mercantil solo publica cuentas anuales: no incluye precio, motivo de venta ni ajustes al EBITDA. Esos datos los aporta el vendedor; el múltiplo y la rentabilidad se calculan en cuanto hay precio y un EBITDA positivo.
        </p>
      </ReportSection>

      {checks.length > 0 ? (
        <ReportSection
          id="revision"
          icon={ClipboardCheck}
          title="Revisión para la due diligence"
          intro="Primeras comprobaciones que haría un comprador o su asesor con las cuentas depositadas. Son lecturas automáticas: los valores marcados como aproximados deben confirmarse con el vendedor."
        >
          {lock(
            "balance",
            <div className="flex flex-col gap-4">
              <ul className="grid gap-2 lg:grid-cols-2">
                {checks.map((check) => (
                  <li key={check.key} className="flex min-w-0 gap-3 rounded-xl border border-[#e7eaee] bg-white p-3">
                    <span className={`mt-1 size-2.5 shrink-0 rounded-full ${diligenceDot[check.level]}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-[#1c2740]">{check.label}</span>
                        <span className="text-sm text-[#0f5f59] tabular-nums">{check.value}</span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[#5c6b78]">{check.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl bg-[#f7f8fb] p-3">
                <p className="text-sm font-semibold text-[#1c2740]">Lo que las cuentas no dicen y hay que pedir al vendedor</p>
                <ul className="mt-1.5 grid gap-x-6 gap-y-1 text-xs leading-5 text-[#5c6b78] sm:grid-cols-2">
                  {diligenceAsks.map((ask) => (
                    <li key={ask} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-[#8b95a7]" aria-hidden />
                      {ask}
                    </li>
                  ))}
                </ul>
              </div>
            </div>,
          )}
        </ReportSection>
      ) : null}

      <ReportSection id="detalle" icon={FileSpreadsheet} title={companyReportCopy.detail} intro={companyReportCopy.detailHint} open={false}>
        <div className="flex flex-col gap-6">
          {figuresOpen ? (
            <>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">{companyCopy.incomeHeading}</h3>
                <FinancialTable years={project.incomeYears} rows={project.incomeRows} trend shareOf={{ key: "sales", label: "ventas" }} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">{companyCopy.balanceHeading}</h3>
                {composition ? <BalanceComposition reading={composition} /> : null}
                <FinancialTable years={project.balanceYears} rows={project.balanceRows} trend shareOf={{ key: "totalAssets", label: "activo" }} />
              </div>
              {indicatorRows.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">Ratios</h3>
                  <IndicatorTable years={project.balanceYears} rows={indicatorRows} />
                </div>
              ) : null}
              {detailRows.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">{companyCopy.detailHeading}</h3>
                  <FinancialTable years={project.balanceYears} rows={detailRows} trend />
                </div>
              ) : null}
            </>
          ) : (
            lock("balance", null)
          )}
          {registry ? <RegistryRecords registry={registry} /> : null}
          {role === "admin" ? adminDetail : null}
          {role === "admin" && project.accountsFormat ? (
            <p className="text-xs text-[#8b95a7]">
              {companyCopy.accountsFormatLabel}: {project.accountsFormat}
            </p>
          ) : null}
        </div>
      </ReportSection>
    </div>
  );
}

type Composition = { year: SabiYear; assets: { label: string; value: number; color: string }[]; funding: { label: string; value: number; color: string }[] };

/** t70: last closed balance as two 100 % bars (what it owns vs how it is funded). Null without a usable balance. */
function balanceComposition(years: SabiYear[]): Composition | null {
  const year = [...years].reverse().find((item) => item.totalAssetsCents !== null && item.totalAssetsCents > 0);
  if (!year) {
    return null;
  }
  const keep = (parts: { label: string; value: number | null; color: string }[]) => parts.flatMap((part) => (part.value !== null && part.value !== 0 ? [{ ...part, value: part.value }] : []));
  const cash = year.cashCents ?? null;
  const currentNoCash = year.currentAssetsCents !== null ? year.currentAssetsCents - (cash ?? 0) : null;
  const assets = keep([
    { label: "Activo no corriente", value: year.nonCurrentAssetsCents, color: navy },
    { label: "Activo corriente (sin caja)", value: currentNoCash, color: "#5b6b8c" },
    { label: "Caja", value: cash, color: "#9aa6bd" },
  ]);
  const funding = keep([
    { label: "Patrimonio neto", value: year.equityCents, color: teal },
    { label: "Pasivo no corriente", value: year.nonCurrentLiabilitiesCents, color: tealMid },
    { label: "Pasivo corriente", value: year.currentLiabilitiesCents, color: tealLight },
  ]);
  return assets.length > 0 && funding.length > 0 ? { year, assets, funding } : null;
}

function BalanceComposition({ reading }: { reading: Composition }) {
  const bar = (title: string, parts: Composition["assets"]) => {
    const total = parts.reduce((sum, part) => sum + Math.abs(part.value), 0) || 1;
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-[#5c6b78]">{title}</p>
        <div className="flex h-5 w-full overflow-hidden rounded-md bg-[#eef0f4]">
          {parts.map((part) => (
            <span
              key={part.label}
              tabIndex={0}
              aria-label={`${part.label}: ${formatEur(part.value)}`}
              className="h-full outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
              style={{ width: `${(Math.abs(part.value) / total) * 100}%`, backgroundColor: part.value < 0 ? "#d98080" : part.color }}
            >
              <ChartTip text={`${part.label}: ${formatEur(part.value)} (${((Math.abs(part.value) / total) * 100).toLocaleString("es-ES", { maximumFractionDigits: 0 })} %)`} />
            </span>
          ))}
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#5c6b78]">
          {parts.map((part) => (
            <li key={part.label} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: part.value < 0 ? "#d98080" : part.color }} />
              {part.label} <span className={`font-semibold tabular-nums ${part.value < 0 ? "text-[#a12f2f]" : "text-[#1c2740]"}`}>{((part.value / total) * 100).toLocaleString("es-ES", { maximumFractionDigits: 0 })} %</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return (
    <div className="mb-3 grid gap-3 rounded-xl border border-[#e7eaee] bg-white p-3 sm:grid-cols-2">
      <p className="text-xs text-[#5c6b78] sm:col-span-2">Composición del balance al cierre de {yearLabel(reading.year)}: qué tiene la empresa y cómo lo financia.</p>
      {bar("Qué tiene (activo)", reading.assets)}
      {bar("Cómo se financia (patrimonio y pasivo)", reading.funding)}
    </div>
  );
}

const diligenceDot: Record<"good" | "warn" | "bad" | "info", string> = {
  good: "bg-[#0f766e]",
  warn: "bg-[#d9a23a]",
  bad: "bg-[#a12f2f]",
  info: "bg-[#9aa6bd]",
};

const diligenceAsks = [
  "Concentración de clientes: peso de los 5 principales en ventas.",
  "Ajustes al EBITDA: sueldos de socios, gastos no recurrentes o personales.",
  "Detalle de la deuda: entidades, vencimientos, garantías y avales personales.",
  "Inversiones previstas y estado de los activos (capex de mantenimiento).",
  "Contingencias fiscales, laborales y litigios abiertos.",
  "Contratos clave, licencias y dependencia de personas concretas.",
];

export function BalanceReading({ year }: { year: SabiYear }) {
  const total = year.totalAssetsCents!;
  const share = (value: number | null) => (value === null ? null : (value / total) * 100);
  const rows = [
    { label: "Total activo", value: total, pct: null as number | null, hint: "Todo lo que tiene la empresa: inmuebles, maquinaria, existencias, clientes pendientes de cobro y caja." },
    { label: "Fondos propios", value: year.equityCents, pct: share(year.equityCents), hint: "Lo que pertenece a los socios (capital + beneficios acumulados)." },
    { label: "Deudas a largo plazo", value: year.nonCurrentLiabilitiesCents, pct: share(year.nonCurrentLiabilitiesCents), hint: "Pasivo no corriente: deudas a devolver en más de un año." },
    { label: "Deudas a corto plazo", value: year.currentLiabilitiesCents, pct: share(year.currentLiabilitiesCents), hint: "Pasivo corriente: proveedores, bancos y otras deudas a menos de un año." },
    { label: "Caja", value: year.cashCents, pct: share(year.cashCents), hint: "Efectivo y saldos en bancos al cierre." },
  ];
  return (
    <section className="rounded-xl border border-[#e7eaee] bg-white p-4">
      <h3 className="text-sm font-semibold text-[#1c2740]">Cierre {yearLabel(year)}</h3>
      <dl className="mt-3 flex flex-col gap-2.5">
        {rows.map((row) =>
          row.value === null ? null : (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <dt className="flex items-center gap-1 text-[#5c6b78]">
                  {row.label}
                  <FieldHint text={row.hint} wide />
                </dt>
                <dd className={`font-semibold tabular-nums ${row.value < 0 ? "text-[#a12f2f]" : "text-[#1c2740]"}`}>
                  {compactEur(row.value)}
                  {row.pct !== null ? <span className="ml-1 text-xs font-normal text-[#8b95a7]">{row.pct.toLocaleString("es-ES", { maximumFractionDigits: 0 })} %</span> : null}
                </dd>
              </div>
              {row.pct !== null ? (
                <div className="mt-1 h-1.5 rounded-full bg-[#eef0f4]">
                  <div className="h-full rounded-full bg-[#2fc4b2]" style={{ width: `${Math.max(0, Math.min(100, row.pct))}%` }} />
                </div>
              ) : null}
            </div>
          ),
        )}
      </dl>
    </section>
  );
}
