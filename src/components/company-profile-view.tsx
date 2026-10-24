import { cloneElement, isValidElement, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Map,
  PieChart,
  Receipt,
  Scale,
  Tags,
  Users,
  EyeOff,
  Lock,
} from "lucide-react";
import { FieldHint } from "@/components/field-hint";
import { FinancialTable } from "@/components/financial-table";
import { ProfileBalanceChart, ProfileIncomeChart } from "@/components/profile-statement-charts";
import { ShareDonut } from "@/components/share-donut";
import { companyCopy } from "@/lib/company-copy";
import { saleReasonLabels, saleReasons } from "@/lib/company-draft";
import {
  figureVeilBalance,
  figureVeilCapital,
  figureVeilChartBalance,
  figureVeilChartIncome,
  figureVeilClient,
  figureVeilIncome,
  figureVeilProduct,
} from "@/lib/figure-veil";
import { formatBasisPoints, headcountLabels } from "@/lib/company-profile";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import { formatEur } from "@/lib/money";

function moneyOrUnavailable(cents: number | null): string {
  return cents === null ? companyCopy.unavailable : formatEur(cents);
}

export function SectionTitle({
  id,
  icon: Icon,
  hint,
  children,
}: {
  id: string;
  icon: typeof Building2;
  hint?: string;
  children: string;
}) {
  return (
    <h2 id={id} className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
      <Icon className="size-5" aria-hidden />
      {children}
      {hint ? <FieldHint text={hint} /> : null}
    </h2>
  );
}

function PublicFact({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-end gap-3">
      <span className="inline-flex size-11 items-center justify-center rounded-md bg-[#eef2ff] p-2.5 text-[#465ab4]">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="mb-1 block text-sm text-[#64748b]">{label}</span>
        <span className="block text-base font-semibold text-[#2b3b4a]">{value}</span>
      </span>
    </div>
  );
}

export function CompanyProfile({
  project,
  figuresOpen = true,
  lockedNote = companyCopy.figuresLocked,
  lockAction = null,
}: {
  project: InvestorProjectProfile;
  figuresOpen?: boolean;
  lockedNote?: string;
  lockAction?: ReactNode;
}) {
  const margin = project.ebitdaMarginBp === null ? companyCopy.unavailable : formatBasisPoints(project.ebitdaMarginBp);
  const metrics = [
    { label: companyCopy.revenueLabel, value: formatEur(project.revenueCents) },
    { label: companyCopy.opexLabel, value: moneyOrUnavailable(project.opexCents) },
    { label: companyCopy.askingPriceLabel, value: formatEur(project.askingPriceCents) },
    { label: companyCopy.ebitdaLabel, value: formatEur(project.ebitdaCents) },
    { label: companyCopy.adjustedEbitdaLabel, value: formatEur(project.adjustedEbitdaCents) },
    { label: companyCopy.ebitdaMarginLabel, value: margin },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="descripcion-general">
        <SectionTitle id="descripcion-general" icon={Building2} hint={companyCopy.generalHint}>
          {companyCopy.generalHeading}
        </SectionTitle>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <PublicFact icon={Map} label={companyCopy.regionLabel} value={project.region} />
          <PublicFact
            icon={Tags}
            label={companyCopy.saleReasonLabel}
            value={project.saleReason && saleReasons.includes(project.saleReason as (typeof saleReasons)[number]) ? saleReasonLabels[project.saleReason as (typeof saleReasons)[number]] : companyCopy.unavailable}
          />
          <PublicFact
            icon={CalendarDays}
            label={companyCopy.foundedYearLabel}
            value={project.foundedYear === null ? companyCopy.unavailable : String(project.foundedYear)}
          />
          <PublicFact
            icon={Users}
            label={companyCopy.workersLabel}
            value={project.headcountRange ? headcountLabels[project.headcountRange] : companyCopy.unavailable}
          />
        </div>
        <h3 className="mt-8 flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
          {companyCopy.descriptionLabel}
        </h3>
        <p className="mt-2 leading-7">{project.description ?? companyCopy.unavailable}</p>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="sectores">
        <SectionTitle id="sectores" icon={Tags} hint={companyCopy.sectorsHint}>
          {companyCopy.sectorsHeading}
        </SectionTitle>
        <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm text-[#8b95a7]">{companyCopy.principalCnaeLabel}</h3>
            {project.principalCnae ? (
              <p className="mt-2 inline-flex rounded-full bg-[#f3f1ff] px-3 py-1 text-sm text-[#3d34b8]">
                {project.principalCnae.code} — {project.principalCnae.title}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[#8b95a7]">{companyCopy.unavailable}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm text-[#8b95a7]">{companyCopy.secondaryCnaeLabel}</h3>
            {project.secondaryCnaes.length === 0 ? (
              <p className="mt-2 text-sm text-[#8b95a7]">{companyCopy.unavailable}</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {project.secondaryCnaes.map((cnae) => (
                  <li key={cnae.code} className="rounded-full bg-[#f5f6fa] px-3 py-1 text-sm text-[#3d34b8]">
                    {cnae.code} — {cnae.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="metricas">
        <SectionTitle id="metricas" icon={Receipt} hint={companyCopy.metricsHint}>
          {companyCopy.metricsHeading}
        </SectionTitle>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-[#f7f8fb] px-4 py-3">
              <dt className="text-xs text-[#8b95a7]">{metric.label}</dt>
              <dd className="mt-2 text-lg font-semibold">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {figuresOpen ? null : <LockedFiguresBanner note={lockedNote} action={lockAction} />}

      {figuresOpen ? (
      <>
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="estructura">
        <SectionTitle id="estructura" icon={PieChart} hint={companyCopy.structureHint}>
          {companyCopy.structureHeading}
        </SectionTitle>
        <LockedFigures open={figuresOpen} kind="structure" note={lockedNote} action={lockAction}>
          <div className="grid gap-4 lg:grid-cols-3">
            <ShareDonut title={companyCopy.chartCapital} slices={project.capital} palette="capital" />
            <ShareDonut title={companyCopy.chartProduct} slices={project.products} palette="product" />
            {project.customerBase === "consumer" ? (
              <section className="flex h-full flex-col gap-3 rounded-xl bg-[#f4f7ff] p-4">
                <h3 className="text-sm font-semibold text-[#1c2740]">{companyCopy.chartClient}</h3>
                <p className="text-sm leading-6 text-[#5c6b78]">{companyCopy.customerConsumerPublic}</p>
              </section>
            ) : (
              <ShareDonut title={companyCopy.chartClient} slices={project.clients} palette="client" />
            )}
          </div>
        </LockedFigures>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="perdidas">
        <SectionTitle id="perdidas" icon={Receipt} hint={companyCopy.incomeHint}>
          {companyCopy.incomeHeading}
        </SectionTitle>
        <LockedFigures open={figuresOpen} kind="income" note={lockedNote} action={lockAction}>
          <FinancialTable years={project.incomeYears} rows={project.incomeRows} />
          <ProfileIncomeChart years={project.incomeYears} rows={project.incomeRows} />
        </LockedFigures>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="balance">
        <SectionTitle id="balance" icon={Scale} hint={companyCopy.balanceHint}>
          {companyCopy.balanceHeading}
        </SectionTitle>
        <LockedFigures open={figuresOpen} kind="balance" note={lockedNote} action={lockAction}>
          <FinancialTable years={project.balanceYears} rows={project.balanceRows} />
          <ProfileBalanceChart years={project.balanceYears} rows={project.balanceRows} />
        </LockedFigures>
      </section>
      </>
      ) : null}
    </div>
  );
}

/**
 * One lock for all private figures (structure, P&L, balance): a single call to action and the three
 * sections listed collapsed, instead of three identical blurred blocks.
 */
function LockedFiguresBanner({ note, action = null }: { note: string; action?: ReactNode }) {
  const sections = [
    { id: "estructura", icon: PieChart, title: companyCopy.structureHeading },
    { id: "perdidas", icon: Receipt, title: companyCopy.incomeHeading },
    { id: "balance", icon: Scale, title: companyCopy.balanceHeading },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white" aria-labelledby="cifras-bloqueadas">
      <div className="relative max-h-56 overflow-hidden">
        <div className="pointer-events-none select-none p-6 blur-md" aria-hidden>
          <FigureVeil kind="income" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/55 px-6 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#eef1fb] text-[#465ab4]">
            <Lock className="size-5" aria-hidden />
          </span>
          <h2 id="cifras-bloqueadas" className="text-xl font-semibold text-[#1c2740]">
            Cifras detalladas bloqueadas
          </h2>
          <p className="max-w-md text-base text-[#3d4a63]">{note}</p>
          {isValidElement(action) ? cloneElement(action) : action}
        </div>
      </div>
      <ul className="divide-y divide-[#e7eaee] border-t border-[#e7eaee]">
        {sections.map((item) => (
          <li key={item.id} id={item.id} className="flex items-center gap-3 px-6 py-4">
            <item.icon className="size-5 text-[#465ab4]" aria-hidden />
            <span className="flex-1 text-base font-medium text-[#1c2740]">{item.title}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-[#5c6b78]">
              <Lock className="size-4" aria-hidden />
              Bloqueado
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LockedFigures({
  open,
  kind,
  note,
  action = null,
  children,
}: {
  open: boolean;
  kind: "structure" | "income" | "balance";
  note: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  if (open) {
    return <div className="mt-6">{children}</div>;
  }

  return (
    <div className="relative mt-6">
      <div className="pointer-events-none select-none blur-md" aria-hidden>
        <FigureVeil kind={kind} />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto z-10 flex flex-col items-center gap-3 px-6 text-center">
          <EyeOff className="size-5 text-[#465ab4]" aria-hidden />
          <p className="max-w-md rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-[#1c2740]">{note}</p>
          {isValidElement(action) ? cloneElement(action) : action}
        </div>
      </div>
    </div>
  );
}

function FigureVeil({ kind }: { kind: "structure" | "income" | "balance" }) {
  if (kind === "structure") {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <ShareDonut title={companyCopy.chartCapital} slices={figureVeilCapital} palette="capital" />
        <ShareDonut title={companyCopy.chartProduct} slices={figureVeilProduct} palette="product" />
        <ShareDonut title={companyCopy.chartClient} slices={figureVeilClient} palette="client" />
      </div>
    );
  }

  if (kind === "income") {
    const income = figureVeilIncome();
    const chart = figureVeilChartIncome();

    return (
      <div>
        <FinancialTable years={income.years} rows={income.rows} />
        <ProfileIncomeChart years={chart.years} rows={chart.rows} />
      </div>
    );
  }

  const balance = figureVeilBalance();
  const chart = figureVeilChartBalance();

  return (
    <div>
      <FinancialTable years={balance.years} rows={balance.rows} />
      <ProfileBalanceChart years={chart.years} rows={chart.rows} />
    </div>
  );
}

