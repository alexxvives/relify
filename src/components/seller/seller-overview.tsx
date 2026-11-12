import Link from "next/link";
import { SabiPendingOverlay } from "@/components/seller/sabi-pending-notice";
import { Check } from "lucide-react";
import { SellerActivitySummary } from "@/components/seller/seller-activity-summary";
import type { SellerFunnel } from "@/lib/server/activity-funnel";
import { CompletionMeter } from "@/components/seller/completion-meter";
import { PendingActions } from "@/components/shell/pending-actions";
import { FieldHint } from "@/components/shell/field-hint";
import { PublishPayButton } from "@/components/seller/publish-seller";
import { FinanceChartsPlaceholder } from "@/components/seller/seller-finance-charts";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import type { SellerDashboard as SellerDashboardData } from "@/lib/server/get-seller-dashboard";
import { billingCopy } from "@/lib/billing-copy";
import { companyCopy } from "@/lib/company-copy";
import type { NotificationView } from "@/lib/notifications";
import { type CheckItem, type PublishChecklist, type RecommendedCheckKey } from "@/lib/publish-checklist";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import { sellerCopy } from "@/lib/seller-copy";
import { Card } from "@/components/ui/form";
import { InfoHint } from "@/components/ui/info-hint";

const photoHref = "/mi-empresa/detalles?seccion=price#fotos";

export function SellerOverview({
  listing,
  payToPublish = false,
  hasPhoto = false,
  payBlocked = null,
  funnel,
  checklist,
  recommended = [],
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
  /** t75: why the pay CTA cannot run yet. */
  payBlocked?: string | null;
  funnel: SellerFunnel;
  notifications: NotificationView[];
  checklist: PublishChecklist;
  recommended?: CheckItem<RecommendedCheckKey>[];
  dashboard: SellerDashboardData;
  pending: HomePendingAction[];
}) {
  // The photo is a recommendation, not a requirement: it never holds the meter back.
  const filled = checklist.items.filter((item) => item.done).length;
  const complete = checklist.ready;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="order-2 flex w-full min-w-0 flex-col gap-6 self-start xl:order-1">
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
              />
            )}
          </section>
        </div>
        <div className="order-1 flex w-full min-w-0 flex-col gap-6 self-start xl:order-2">
          <Card>
            <h2
              className={
                sold
                  ? "text-xl font-semibold whitespace-nowrap text-[#17663a]"
                  : listing === "published"
                  ? "text-xl font-semibold whitespace-nowrap text-[#17663a]"
                  : listing === "pending"
                    ? "flex w-full items-center justify-center gap-1.5 text-center text-xl font-semibold whitespace-nowrap text-[#0f766e]"
                    : "text-lg font-semibold whitespace-nowrap text-[#c0362c]"
              }
            >
              {sold
                ? "Tu empresa se ha vendido."
                : listing === "published"
                ? billingCopy.sellerPublished
                : listing === "pending"
                  ? (
                      <>
                        {billingCopy.reviewPending}
                        <InfoHint text={billingCopy.reviewRequested} icon="info" align="center" />
                      </>
                    )
                  : sellerCopy.unpublished}
            </h2>
            {listing === "draft" && payToPublish && checklist.ready ? <PublishPayButton blocked={payBlocked} /> : null}
            <CompletionMeter filled={filled} total={checklist.items.length} label={complete ? sellerCopy.completedLabel : sellerCopy.meterPending} />
            {/* t87: neutral rows; only the Obligatorio / Recomendado tag carries colour, a check marks done steps. */}
            <ul className="mt-4 overflow-hidden rounded-xl border border-[#e6eaf5] bg-white">
              {[
                ...checklist.items.map((item) => ({ key: item.key, label: item.label, hint: item.hint, done: item.done, href: item.href, required: true })),
                ...recommended.map((item) => ({ key: item.key, label: item.label, hint: item.hint, done: item.done, href: item.href, required: false })),
                { key: "photo", label: sellerCopy.panelPhoto, hint: sellerCopy.panelPhotoHint, done: hasPhoto, href: photoHref, required: false },
              ].map((item) => {
                const row = (
                  <>
                    <span title={item.hint && !item.done ? item.hint : undefined} className={`min-w-0 xl:whitespace-nowrap ${item.done ? "text-[#667085]" : "font-medium text-[#1c2740]"}`}>{item.label}</span>
                    {item.done ? (
                      <Check className="size-4 shrink-0 text-[#17663a]" aria-label="Hecho" />
                    ) : (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${item.required ? "bg-[#fdecea] text-[#a12f2f]" : "bg-[#fff4d6] text-[#8a6112]"}`}>
                        {item.required ? "Obligatorio" : companyCopy.cardPhotosRecommended}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={item.key} className="border-t border-[#e6eaf5] first:border-t-0">
                    {item.done ? (
                      <div className="flex items-center justify-between gap-3 px-3 py-3 text-sm">{row}</div>
                    ) : (
                      <Link href={item.href} className="flex items-center justify-between gap-3 px-3 py-3 text-sm hover:bg-[#f7f8fb]">
                        {row}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
          <PendingActions side items={pending} empty={sellerCopy.pendingEmpty} />
        </div>
      </div>
    </div>
  );
}
