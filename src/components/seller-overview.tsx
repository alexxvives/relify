import Link from "next/link";
import { Check, Circle, Info, TriangleAlert } from "lucide-react";
import { CompletionMeter } from "@/components/completion-meter";
import { PendingActions } from "@/components/pending-actions";
import { FieldHint } from "@/components/field-hint";
import { NoticeList } from "@/components/notice-list";
import { PublishSellerButton } from "@/components/publish-seller";
import { FinanceCharts } from "@/components/seller-finance-charts";
import { billingCopy } from "@/lib/billing-copy";
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
  interests,
  questions,
  meetings,
  notifications,
  panels,
  series,
  mixes,
  costYears,
  pending,
}: {
  listing: "missing" | "draft" | "pending" | "published";
  payToPublish?: boolean;
  interests: number;
  questions: number;
  meetings: number;
  notifications: NotificationView[];
  panels: SellerPanelFlags;
  series: SellerYearPoint[];
  mixes: SellerMix[];
  costYears: SellerCostYear[];
  pending: HomePendingAction[];
}) {
  const filled = filledSellerPanels(panels);
  const complete = filled === panelSteps.length;
  const activity = [
    { label: sellerCopy.interests, value: interests },
    { label: sellerCopy.questions, value: questions },
    { label: sellerCopy.meetings, value: meetings },
  ];
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
      {listing === "published" || listing === "pending" ? null : (
        <section className="flex flex-col gap-3 rounded-2xl bg-[#fff8db] px-4 py-3 text-[#614d05] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#b58105]" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-[#2b3b4a]">{sellerCopy.incompleteTitle}</p>
              <p className="text-sm text-[#614d05]">{sellerCopy.incompleteBody}</p>
            </div>
          </div>
          <Link href="/mi-empresa/detalles" className="shrink-0 text-sm font-medium text-[#1c2740] underline">
            {sellerCopy.completeNow}
          </Link>
        </section>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="flex flex-col gap-6">
          <PendingActions items={pending} empty={sellerCopy.pendingEmpty} />
          <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
              {sellerCopy.financeTitle}
              <FieldHint text={sellerCopy.financeIntro} />
            </h2>
            {series.length === 0 ? (
              <div className="mt-4 rounded-xl bg-[#f3f5f8] px-4 py-8 text-center">
                <p className="text-sm text-[#667085]">{sellerCopy.financeEmpty}</p>
                <Link href="/mi-empresa/detalles" className="mt-3 inline-flex text-sm font-medium text-[#2454d6] underline">
                  {sellerCopy.financeOpen}
                </Link>
              </div>
            ) : (
              <FinanceCharts points={chartPoints} mixes={mixes} costYears={chartCostYears} />
            )}
          </section>
          <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white p-5">
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
              {sellerCopy.activityTitle}
              <FieldHint text={sellerCopy.activityIntro} />
            </h2>
            {listing === "published" ? (
              <ul className="mt-4 grid grid-cols-3 gap-3">
                {activity.map((item) => (
                  <li key={item.label} className="rounded-xl bg-[#f3f5f8] px-3 py-4">
                    <p className="text-2xl font-semibold text-[#1c2740]">{item.value}</p>
                    <p className="mt-1 text-xs text-[#667085]">{item.label}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl bg-[#f3f5f8] px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[#1c2740]">{sellerCopy.activityEmpty}</p>
                <p className="mt-1 text-sm text-[#667085]">{sellerCopy.activityEmptyBody}</p>
              </div>
            )}
            {listing === "published" ? null : (
              <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#eef1f6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm text-[#3d4a63]">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {sellerCopy.activityLocked}
                </p>
                <Link href="/mi-empresa/detalles" className="shrink-0 text-sm font-medium text-[#2454d6] underline">
                  {sellerCopy.fillInfo}
                </Link>
              </div>
            )}
          </section>
        </div>
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
            <h2 className={complete ? "text-2xl font-semibold text-[#17663a]" : "text-2xl font-semibold text-[#2b3b4a]"}>
              {listing === "published"
                ? billingCopy.sellerPublished
                : listing === "pending"
                  ? billingCopy.reviewPending
                  : sellerCopy.unpublished}
            </h2>
            {listing === "pending" ? <p className="mt-2 text-sm text-[#614d05]">{billingCopy.reviewRequested}</p> : null}
            {listing === "draft" ? <PublishSellerButton requiresPayment={payToPublish} /> : null}
            <CompletionMeter filled={filled} total={panelSteps.length} label={sellerCopy.completedLabel} />
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
            </ul>
          </section>
          <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sellerCopy.notificationsTitle}</h2>
            {notifications.length === 0 ? (
              <p className="mt-8 text-sm text-[#667085]">{sellerCopy.notificationsEmpty}</p>
            ) : (
              <NoticeList items={notifications} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
