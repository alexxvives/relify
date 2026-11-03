import Link from "next/link";
import { SabiPendingOverlay } from "@/components/sabi-pending-notice";
import { Check, CircleAlert, Plus } from "lucide-react";
import { SellerActivitySummary } from "@/components/seller-activity-summary";
import type { SellerFunnel } from "@/server/activityFunnel";
import { CompletionMeter } from "@/components/completion-meter";
import { PendingActions } from "@/components/pending-actions";
import { FieldHint } from "@/components/field-hint";
import { PublishPayButton } from "@/components/publish-seller";
import { FinanceChartsPlaceholder } from "@/components/seller-finance-charts";
import { SellerDashboard } from "@/components/seller-dashboard";
import type { SellerDashboard as SellerDashboardData } from "@/server/getSellerDashboard";
import { billingCopy } from "@/lib/billing-copy";
import { companyCopy } from "@/lib/company-copy";
import type { NotificationView } from "@/lib/notifications";
import { type CheckItem, type PublishChecklist, type RecommendedCheckKey } from "@/lib/publish-checklist";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import { sellerCopy } from "@/lib/seller-copy";
import { Card } from "@/components/ui/form";

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
                    ? "text-xl font-semibold text-[#0f766e]"
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
            {listing === "pending" ? <p className="mt-2 text-sm text-[#475467]">{billingCopy.reviewRequested}</p> : null}
            {listing === "draft" && payToPublish && checklist.ready ? <PublishPayButton blocked={payBlocked} /> : null}
            <CompletionMeter filled={filled} total={checklist.items.length} label={complete ? sellerCopy.completedLabel : sellerCopy.meterPending} />
            {/* t86: one list. Missing required steps in red, missing recommended ones in amber; each carries a tag so colour is not the only cue. */}
            <ul className="mt-4 overflow-hidden rounded-xl border border-[#e6eaf5] bg-white">
              {[
                ...checklist.items.map((item) => ({ key: item.key, label: item.label, hint: item.hint, done: item.done, href: item.href, required: true })),
                ...recommended.map((item) => ({ key: item.key, label: item.label, hint: item.hint, done: item.done, href: item.href, required: false })),
                { key: "photo", label: sellerCopy.panelPhoto, hint: sellerCopy.panelPhotoHint, done: hasPhoto, href: photoHref, required: false },
              ].map((item) => {
                const tone = item.done ? "done" : item.required ? "required" : "recommended";
                const row = (
                  <>
                    <span className={`flex min-w-0 items-center gap-1.5 ${tone === "done" ? "text-[#17663a]" : tone === "required" ? "font-medium text-[#a12f2f]" : "font-medium text-[#8a6112]"}`}>
                      {item.label}
                      {item.hint && !item.done ? <FieldHint text={item.hint} /> : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {item.done ? null : (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.required ? "bg-[#fdecea] text-[#a12f2f]" : "bg-[#fff4d6] text-[#8a6112]"}`}>
                          {item.required ? "Obligatorio" : companyCopy.cardPhotosRecommended}
                        </span>
                      )}
                      {item.done ? (
                        <Check className="size-4 shrink-0 text-[#17663a]" aria-label="Hecho" />
                      ) : item.required ? (
                        <CircleAlert className="size-4 shrink-0 text-[#c0362c]" aria-label="Pendiente" />
                      ) : (
                        <Plus className="size-4 shrink-0 text-[#b88a1b]" aria-label="Pendiente" />
                      )}
                    </span>
                  </>
                );
                const stripe = tone === "done" ? "border-l-transparent" : tone === "required" ? "border-l-[#c0362c] bg-[#fff8f7]" : "border-l-[#e0b546] bg-[#fffdf5]";
                return (
                  <li key={item.key} className={`border-t border-l-4 border-t-[#e6eaf5] first:border-t-0 ${stripe}`}>
                    {item.done ? (
                      <div className="flex items-center justify-between gap-3 px-3 py-3 text-sm">{row}</div>
                    ) : (
                      <Link href={item.href} className={`flex items-center justify-between gap-3 px-3 py-3 text-sm ${item.required ? "hover:bg-[#fdecea]" : "hover:bg-[#fff6dc]"}`}>
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
    </div>
  );
}
