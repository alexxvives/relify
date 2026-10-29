import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { SellerActivitySummary } from "@/components/seller-activity-summary";
import type { SellerFunnel } from "@/server/activityFunnel";
import { CompletionMeter } from "@/components/completion-meter";
import { PendingActions } from "@/components/pending-actions";
import { FieldHint } from "@/components/field-hint";
import { PublishSellerButton } from "@/components/publish-seller";
import { FinanceCharts, FinanceChartsPlaceholder } from "@/components/seller-finance-charts";
import { billingCopy } from "@/lib/billing-copy";
import { companyCopy } from "@/lib/company-copy";
import { formatCompactEur } from "@/lib/money";
import type { NotificationView } from "@/lib/notifications";
import { filledSellerPanels, type SellerFocusPanel, type SellerPanelFlags } from "@/lib/company-profile";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import { sellerCopy } from "@/lib/seller-copy";
import type { SellerCostYear, SellerMix, SellerYearPoint } from "@/server/getSellerOverview";

const panelSteps = [
  { key: "identity", label: sellerCopy.panelIdentity },
  { key: "description", label: sellerCopy.panelDescription },
  { key: "cnae", label: sellerCopy.panelCnae },
  { key: "income", label: sellerCopy.panelIncome },
  { key: "balance", label: sellerCopy.panelBalance },
  { key: "structure", label: sellerCopy.panelStructure },
  { key: "price", label: sellerCopy.panelPrice },
] as const;

const photoHref = "/mi-empresa/detalles?seccion=price#fotos";

const panelHref: Record<SellerFocusPanel, string> = {
  identity: "/mi-empresa/detalles?seccion=identity#panel-identity",
  description: "/mi-empresa/detalles?seccion=description#panel-description",
  cnae: "/mi-empresa/detalles?seccion=cnae#panel-cnae",
  income: "/mi-empresa/detalles?seccion=income#panel-income",
  balance: "/mi-empresa/detalles?seccion=balance#panel-balance",
  structure: "/mi-empresa/detalles?seccion=structure#panel-structure",
  price: "/mi-empresa/detalles?seccion=price#panel-price",
};

export function SellerOverview({
  listing,
  payToPublish = false,
  hasPhoto = false,
  funnel,
  panels,
  series,
  mixes,
  costYears,
  pending,
  sold = false,
}: {
  sold?: boolean;
  listing: "missing" | "draft" | "pending" | "published";
  payToPublish?: boolean;
  hasPhoto?: boolean;
  funnel: SellerFunnel;
  notifications: NotificationView[];
  panels: SellerPanelFlags;
  series: SellerYearPoint[];
  mixes: SellerMix[];
  costYears: SellerCostYear[];
  pending: HomePendingAction[];
}) {
  // The photo is a recommendation, not a requirement: it never holds the meter back.
  const filled = filledSellerPanels(panels);
  const complete = filled === panelSteps.length;
  const chartPoints = series.map((point) => ({
    ...point,
    salesLabel: point.salesCents === null ? "—" : formatCompactEur(point.salesCents),
    ebitdaLabel: point.ebitdaCents === null ? null : formatCompactEur(point.ebitdaCents),
  }));
  const chartCostYears = costYears.map((year) => ({
    year: year.year,
    slices: year.slices.map((cost) => ({ ...cost, amountLabel: formatCompactEur(cost.cents) })),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="flex w-full min-w-0 flex-col gap-6 self-start">
          <SellerActivitySummary funnel={funnel} />
          <section className="w-full rounded-2xl border border-[#e7eaee] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
                {sellerCopy.financeTitle}
                <FieldHint text={sellerCopy.financeIntro} />
              </h2>
            </div>
            {series.length === 0 ? (
              <>
                <p className="mt-1 text-sm text-[#667085]">{sellerCopy.financeEmpty}</p>
                <FinanceChartsPlaceholder />
              </>
            ) : (
              <FinanceCharts points={chartPoints} mixes={mixes} costYears={chartCostYears} />
            )}
          </section>
        </div>
        <div className="relative w-full xl:min-h-full">
          <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
          <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
            <h2
              className={
                sold
                  ? "text-xl font-semibold whitespace-nowrap text-[#17663a]"
                  : listing === "published"
                  ? "text-xl font-semibold whitespace-nowrap text-[#17663a]"
                  : listing === "pending"
                    ? "text-xl font-semibold sm:whitespace-nowrap text-[#8a6112]"
                    : "text-lg font-semibold whitespace-nowrap text-[#c0362c]"
              }
            >
              {sold
                ? "Tu empresa se ha vendido."
                : listing === "published"
                ? billingCopy.sellerPublished
                : listing === "pending"
                  ? billingCopy.reviewPending
                  : sellerCopy.unpublished}
            </h2>
            {listing === "pending" ? <p className="mt-2 text-sm text-[#614d05]">{billingCopy.reviewRequested}</p> : null}
            {listing === "draft" ? <PublishSellerButton requiresPayment={payToPublish} /> : null}
            <CompletionMeter filled={filled} total={panelSteps.length} label={complete ? sellerCopy.completedLabel : sellerCopy.meterPending} />
            <ul className="mt-4 overflow-hidden rounded-xl bg-[#f4f7ff]">
              {panelSteps.map((item) => {
                const done = panels[item.key];
                const row = (
                  <>
                    <span className={done ? "text-[#17663a]" : undefined}>{item.label}</span>
                    {done ? (
                      <Check className="size-4 shrink-0 text-[#17663a]" aria-hidden />
                    ) : (
                      <Circle className="size-4 shrink-0 text-[#c5cdd6]" aria-hidden />
                    )}
                  </>
                );
                return (
                  <li key={item.key} className="border-t border-[#e6eaf5] first:border-t-0">
                    {done ? (
                      <div className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#1c2740]">{row}</div>
                    ) : (
                      <Link
                        href={panelHref[item.key]}
                        className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#1c2740]"
                      >
                        {row}
                      </Link>
                    )}
                  </li>
                );
              })}
              <li className="border-t border-[#e6eaf5]">
                {hasPhoto ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#1c2740]">
                    <span className="text-[#17663a]">{sellerCopy.panelPhoto}</span>
                    <Check className="size-4 shrink-0 text-[#17663a]" aria-hidden />
                  </div>
                ) : (
                  <Link href={photoHref} className="flex items-center justify-between gap-3 bg-[#fff8db] px-3 py-3 text-sm text-[#1c2740]">
                    <span>{sellerCopy.panelPhoto}</span>
                    <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-xs font-semibold text-[#8a6112]">{companyCopy.cardPhotosRecommended}</span>
                  </Link>
                )}
              </li>
            </ul>
          </section>
          <PendingActions side items={pending} empty={sellerCopy.pendingEmpty} />
          </div>
        </div>
      </div>
    </div>
  );
}
