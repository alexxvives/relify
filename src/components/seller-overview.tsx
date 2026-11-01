import Link from "next/link";
import { SabiPendingOverlay } from "@/components/sabi-pending-notice";
import { Check, Circle } from "lucide-react";
import { SellerActivitySummary } from "@/components/seller-activity-summary";
import type { SellerFunnel } from "@/server/activityFunnel";
import { CompletionMeter } from "@/components/completion-meter";
import { PendingActions } from "@/components/pending-actions";
import { FieldHint } from "@/components/field-hint";
import { PublishSellerButton } from "@/components/publish-seller";
import { FinanceChartsPlaceholder } from "@/components/seller-finance-charts";
import { SellerDashboard } from "@/components/seller-dashboard";
import type { SellerDashboard as SellerDashboardData } from "@/server/getSellerDashboard";
import { billingCopy } from "@/lib/billing-copy";
import { companyCopy } from "@/lib/company-copy";
import type { NotificationView } from "@/lib/notifications";
import { missingHint, type PublishChecklist } from "@/lib/publish-checklist";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import { sellerCopy } from "@/lib/seller-copy";
import { Card } from "@/components/ui/form";

const photoHref = "/mi-empresa/detalles?seccion=price#fotos";

export function SellerOverview({
  listing,
  payToPublish = false,
  hasPhoto = false,
  funnel,
  checklist,
  dashboard,
  pending,
  sold = false,
  financialsPending = false,
}: {
  sold?: boolean;
  /** CIF verified, SABI financials not imported yet: the charts area shows the 24 h overlay. */
  financialsPending?: boolean;
  listing: "missing" | "draft" | "pending" | "published";
  payToPublish?: boolean;
  hasPhoto?: boolean;
  funnel: SellerFunnel;
  notifications: NotificationView[];
  checklist: PublishChecklist;
  dashboard: SellerDashboardData;
  pending: HomePendingAction[];
}) {
  // The photo is a recommendation, not a requirement: it never holds the meter back.
  const filled = checklist.items.filter((item) => item.done).length;
  const complete = checklist.ready;

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
            {financialsPending ? (
              <div className="relative mt-3 min-h-64">
                <div aria-hidden className="pointer-events-none select-none">
                  <FinanceChartsPlaceholder />
                </div>
                <SabiPendingOverlay />
              </div>
            ) : dashboard.years.length === 0 ? (
              <>
                <p className="mt-1 text-sm text-[#667085]">{sellerCopy.financeEmpty}</p>
                <FinanceChartsPlaceholder />
              </>
            ) : (
              <SellerDashboard
                years={dashboard.years}
                directors={dashboard.directors}
                shareholders={dashboard.shareholders}
                funnel={funnel}
                checklist={checklist}
              />
            )}
          </section>
        </div>
        <div className="relative w-full xl:min-h-full">
          <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
          <Card>
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
            {listing === "draft" ? <PublishSellerButton requiresPayment={payToPublish} ready={checklist.ready} hint={missingHint(checklist.missing)} /> : null}
            <CompletionMeter filled={filled} total={checklist.items.length} label={complete ? sellerCopy.completedLabel : sellerCopy.meterPending} />
            <ul className="mt-4 overflow-hidden rounded-xl bg-[#f4f7ff]">
              {checklist.items.map((item) => {
                const row = (
                  <>
                    <span className={`flex min-w-0 items-center gap-1.5 ${item.done ? "text-[#17663a]" : ""}`}>
                      {item.label}
                      {item.hint ? <FieldHint text={item.hint} /> : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {item.fromRegistry ? (
                        <span className="rounded-full bg-[#e6f6f3] px-2 py-0.5 text-[11px] font-semibold text-[#0f766e]">SABI</span>
                      ) : null}
                      {item.done ? (
                        <Check className="size-4 shrink-0 text-[#17663a]" aria-label="Hecho" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-[#c5cdd6]" aria-label="Pendiente" />
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={item.key} className="border-t border-[#e6eaf5] first:border-t-0">
                    {item.done ? (
                      <div className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#1c2740]">{row}</div>
                    ) : (
                      <Link href={item.href} className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#1c2740] hover:bg-[#eaf0ff]">
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
                    <span className="flex min-w-0 items-center gap-1.5">
                      {sellerCopy.panelPhoto}
                      <FieldHint text={sellerCopy.panelPhotoHint} />
                    </span>
                    <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-xs font-semibold text-[#8a6112]">{companyCopy.cardPhotosRecommended}</span>
                  </Link>
                )}
              </li>
            </ul>
          </Card>
          <PendingActions side items={pending} empty={sellerCopy.pendingEmpty} />
          </div>
        </div>
      </div>
    </div>
  );
}
