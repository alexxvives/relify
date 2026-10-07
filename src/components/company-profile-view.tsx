import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Map,
  PieChart,
  Receipt,
  Scale,
  Tags,
  Users,
} from "lucide-react";
import { FinancialTable } from "@/components/financial-table";
import { ProfileBalanceChart, ProfileIncomeChart } from "@/components/profile-statement-charts";
import { ShareDonut } from "@/components/share-donut";
import { companyCopy } from "@/lib/company-copy";
import { formatBasisPoints, headcountLabels } from "@/lib/company-profile";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import { formatEur } from "@/lib/money";

function moneyOrUnavailable(cents: number | null): string {
  return cents === null ? companyCopy.unavailable : formatEur(cents);
}

export function SectionTitle({ id, icon: Icon, children }: { id: string; icon: typeof Building2; children: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
      <Icon className="size-5" aria-hidden />
      {children}
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
}: {
  project: InvestorProjectProfile;
  figuresOpen?: boolean;
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
        <SectionTitle id="descripcion-general" icon={Building2}>
          {companyCopy.generalHeading}
        </SectionTitle>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <PublicFact icon={Map} label={companyCopy.regionLabel} value={project.region} />
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
        <p className="mt-2 max-w-3xl whitespace-pre-wrap leading-7">{project.description ?? companyCopy.unavailable}</p>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="sectores">
        <SectionTitle id="sectores" icon={Tags}>
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
        <SectionTitle id="metricas" icon={Receipt}>
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

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="estructura">
        <SectionTitle id="estructura" icon={PieChart}>
          {companyCopy.structureHeading}
        </SectionTitle>
        <LockedFigures open={figuresOpen} standIn={<DonutStandIn />}>
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
        <SectionTitle id="perdidas" icon={Receipt}>
          {companyCopy.incomeHeading}
        </SectionTitle>
        <LockedFigures open={figuresOpen} standIn={<StatementStandIn />}>
          <div className="overflow-x-auto">
            <FinancialTable years={project.incomeYears} rows={project.incomeRows} />
          </div>
          <ProfileIncomeChart years={project.incomeYears} rows={project.incomeRows} />
        </LockedFigures>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="balance">
        <SectionTitle id="balance" icon={Scale}>
          {companyCopy.balanceHeading}
        </SectionTitle>
        <LockedFigures open={figuresOpen} standIn={<StatementStandIn />}>
          <div className="overflow-x-auto">
            <FinancialTable years={project.balanceYears} rows={project.balanceRows} />
          </div>
          <ProfileBalanceChart years={project.balanceYears} rows={project.balanceRows} />
        </LockedFigures>
      </section>
    </div>
  );
}

function LockedFigures({ open, standIn, children }: { open: boolean; standIn: ReactNode; children: ReactNode }) {
  if (open) {
    return <div className="mt-6">{children}</div>;
  }

  return (
    <div className="relative mt-6">
      <div className="pointer-events-none select-none blur-md" aria-hidden>
        {standIn}
      </div>
      <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm font-medium text-[#1c2740]">
        {companyCopy.figuresLocked}
      </p>
    </div>
  );
}

function DonutStandIn() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl bg-[#f4f7ff] p-4">
          <div className="mx-auto size-28 rounded-full bg-[#d5dced]" />
          <div className="mx-auto mt-4 h-3 w-24 rounded-full bg-[#d5dced]" />
        </div>
      ))}
    </div>
  );
}

function StatementStandIn() {
  return (
    <div>
      <div className="grid gap-2">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="grid grid-cols-4 gap-3">
            <div className="h-4 rounded bg-[#e6e9f0]" />
            <div className="h-4 rounded bg-[#d5dced]" />
            <div className="h-4 rounded bg-[#d5dced]" />
            <div className="h-4 rounded bg-[#d5dced]" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex h-36 items-end gap-3">
        {[42, 68, 54, 80].map((height, index) => (
          <div key={index} className="flex-1 rounded-t-lg bg-[#c5d0ea]" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

