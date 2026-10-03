import Link from "next/link";
import {
  ArrowLeftRight,
  Building2,
  Calendar,
  FileText,
  MapPin,
  MessageCircle,
  PieChart,
  Receipt,
  Scale,
  Tags,
  Users,
} from "lucide-react";
import { InvestorProjectTabs } from "@/components/investor-project-tabs";
import { FavoriteButton } from "@/components/favorite-button";
import { FinancialTable } from "@/components/financial-table";
import { ConnectControl, ProjectAccessPanel } from "@/components/project-access-panel";
import { ProjectFigures } from "@/components/project-card";
import { ShareDonut } from "@/components/share-donut";
import { companyCopy } from "@/lib/company-copy";
import { formatBasisPoints, headcountLabels, headcountRanges } from "@/lib/company-profile";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import { formatEur } from "@/lib/money";
import type { ProjectAccessView } from "@/lib/project-access";
import type { PublicProjectCard } from "@/lib/public-project";

function moneyOrUnavailable(cents: number | null): string {
  return cents === null ? companyCopy.unavailable : formatEur(cents);
}

function SectionTitle({ id, icon: Icon, children }: { id: string; icon: typeof Building2; children: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-xl font-semibold">
      <Icon className="size-5 text-[#3d34b8]" aria-hidden />
      {children}
    </h2>
  );
}

function CompanyProfile({ project }: { project: InvestorProjectProfile }) {
  const margin = project.ebitdaMarginBp === null ? companyCopy.unavailable : formatBasisPoints(project.ebitdaMarginBp);
  const metrics = [
    { label: companyCopy.revenueLabel, value: formatEur(project.revenueCents) },
    { label: companyCopy.ebitdaLabel, value: formatEur(project.ebitdaCents) },
    { label: companyCopy.adjustedEbitdaLabel, value: formatEur(project.adjustedEbitdaCents) },
    { label: companyCopy.ebitdaMarginLabel, value: margin },
    { label: companyCopy.opexLabel, value: moneyOrUnavailable(project.opexCents) },
    { label: companyCopy.askingPriceLabel, value: formatEur(project.askingPriceCents) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="descripcion-general">
        <SectionTitle id="descripcion-general" icon={Building2}>
          {companyCopy.generalHeading}
        </SectionTitle>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-2 text-sm text-[#8b95a7]">
              <MapPin className="size-4" aria-hidden />
              {companyCopy.locationLabel}
            </dt>
            <dd className="mt-1 text-lg font-semibold">{project.region}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm text-[#8b95a7]">
              <Calendar className="size-4" aria-hidden />
              {companyCopy.foundedYearLabel}
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {project.foundedYear === null ? companyCopy.unavailable : project.foundedYear}
            </dd>
          </div>
        </dl>
        <h3 className="mt-8 text-sm font-medium text-[#5c6b78]">{companyCopy.descriptionLabel}</h3>
        <p className="mt-2 max-w-3xl whitespace-pre-wrap leading-7">{project.description ?? companyCopy.unavailable}</p>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="sectores">
        <SectionTitle id="sectores" icon={Tags}>
          {companyCopy.sectorsHeading}
        </SectionTitle>
        <div className="mt-6 flex flex-col gap-4">
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
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <ShareDonut title={companyCopy.shareholdersLegend} kind="capital" slices={project.capital} />
          <ShareDonut title={companyCopy.productsLegend} kind="product" slices={project.products} />
          <ShareDonut title={companyCopy.clientsLegend} kind="client" slices={project.clients} />
        </div>
        <div className="mt-8 border-t border-[#e6e9f0] pt-6">
          <p className="flex items-center gap-2 text-sm text-[#5c6b78]">
            <Users className="size-4" aria-hidden />
            {companyCopy.headcountLabel}
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {project.headcountRange ? headcountLabels[project.headcountRange] : companyCopy.unavailable}
          </p>
          <p className="text-xs text-[#8b95a7]">{companyCopy.workersLabel}</p>
          <ol className="mt-4 grid grid-cols-5 gap-2">
            {headcountRanges.map((band) => (
              <li key={band}>
                <div className={band === project.headcountRange ? "h-2 rounded-full bg-[#3d34b8]" : "h-2 rounded-full bg-[#e6e9f0]"} />
                <span className="mt-2 block text-center text-xs text-[#5c6b78]">{headcountLabels[band]}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="perdidas">
        <SectionTitle id="perdidas" icon={Receipt}>
          {companyCopy.incomeHeading}
        </SectionTitle>
        <div className="mt-6 overflow-x-auto">
          <FinancialTable years={project.incomeYears} rows={project.incomeRows} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="balance">
        <SectionTitle id="balance" icon={Scale}>
          {companyCopy.balanceHeading}
        </SectionTitle>
        <div className="mt-6 overflow-x-auto">
          <FinancialTable years={project.balanceYears} rows={project.balanceRows} />
        </div>
      </section>
    </div>
  );
}

function EmptyPanel({ icon: Icon, text }: { icon: typeof MessageCircle; text: string }) {
  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white px-6 py-12 text-center">
      <Icon className="mx-auto size-6 text-[#3d34b8]" aria-hidden />
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#5c6b78]">{text}</p>
    </section>
  );
}

export function InvestorProject({
  project,
  recommendations,
  access,
  favorited,
}: {
  project: InvestorProjectProfile;
  recommendations: PublicProjectCard[];
  access: ProjectAccessView;
  favorited: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/mercado" className="text-sm font-medium text-[#3d34b8] hover:underline">
          {companyCopy.backToMarket}
        </Link>
        <div className="flex items-center gap-2">
          <FavoriteButton slug={project.slug} favorited={favorited} />
          <ConnectControl slug={project.slug} status={access} />
        </div>
      </div>

      <ProjectAccessPanel slug={project.slug} status={access} />

      <InvestorProjectTabs
        panels={{
          company: <CompanyProfile project={project} />,
          transaction: (
            <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6">
              <SectionTitle id="transaccion" icon={ArrowLeftRight}>
                {companyCopy.tabs.transaction}
              </SectionTitle>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5c6b78]">{companyCopy.transactionIntro}</p>
              <div className="mt-6">
                <ProjectFigures project={project} />
              </div>
              <ol className="mt-6 grid gap-2 sm:grid-cols-4">
                {companyCopy.transactionSteps.map((step, index) => (
                  <li key={step} className="rounded-2xl bg-[#f7f8fb] px-3 py-3 text-sm">
                    <span className="text-xs font-semibold text-[#3d34b8]">{index + 1}</span>
                    <span className="mt-1 block font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ),
          questions: <EmptyPanel icon={MessageCircle} text={companyCopy.questionsEmpty} />,
          meetings: <EmptyPanel icon={Calendar} text={companyCopy.meetingsEmpty} />,
          offer: (
            <EmptyPanel icon={FileText} text={access === "accepted" ? companyCopy.offerEmpty : companyCopy.offerLocked} />
          ),
        }}
      />

      {recommendations.length > 0 ? (
        <section aria-labelledby="recomendadas">
          <h2 id="recomendadas" className="text-xl font-semibold">
            {companyCopy.recommendationsHeading}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {recommendations.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
                <Link href={`/proyectos/${item.slug}`} className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{item.codename}</h3>
                    <p className="text-sm text-[#5c6b78]">{item.region}</p>
                  </div>
                  <ProjectFigures project={item} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
