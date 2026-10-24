import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Circle, Clock, TriangleAlert } from "lucide-react";
import { CompletionMeter } from "@/components/completion-meter";
import { PendingActions } from "@/components/pending-actions";
import { FieldHint } from "@/components/field-hint";
import { NoticeList } from "@/components/notice-list";
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

function SaleHero({
  firstName,
  listing,
  sold,
  next,
  missingHref,
}: {
  firstName: string;
  listing: "missing" | "draft" | "pending" | "published";
  sold: boolean;
  next: HomePendingAction | null;
  missingHref: string | null;
}) {
  const status = sold
    ? { label: "Vendida", tone: "bg-[#e7f6ee] text-[#1b7a45]", Icon: BadgeCheck }
    : listing === "published"
      ? { label: "Publicada en el mercado", tone: "bg-[#e7f6ee] text-[#1b7a45]", Icon: BadgeCheck }
      : listing === "pending"
        ? { label: "En revisión por Relify", tone: "bg-[#fff4d6] text-[#7a5410]", Icon: Clock }
        : { label: "Sin publicar", tone: "bg-[#fdecea] text-[#a32d23]", Icon: TriangleAlert };
  const step: { text: string; href: string | null; cta: string | null } = sold
    ? { text: "La venta está cerrada. Tienes el contrato firmado en Mis documentos.", href: "/mi-empresa/documentos", cta: "Ver documentos" }
    : next
      ? { text: `${next.title} · ${next.detail}`, href: next.href, cta: "Hacerlo ahora" }
      : listing === "published"
        ? { text: "No tienes nada pendiente. Te avisaremos cuando un comprador se interese.", href: "/mi-empresa/procesos", cta: "Ver compradores" }
        : listing === "pending"
          ? { text: "Estamos revisando tu empresa. Suele tardar menos de 48 horas.", href: null, cta: null }
          : missingHref
            ? { text: "Completa los datos de tu empresa para poder publicarla.", href: missingHref, cta: "Completar datos" }
            : { text: "Tus datos están completos. Publica tu empresa para recibir compradores.", href: "/mi-empresa/detalles", cta: "Revisar y publicar" };

  return (
    <section aria-labelledby="tu-venta" className="rounded-2xl border border-[#e7eaee] bg-white p-5 sm:p-6">
      <h1 className="text-3xl font-semibold tracking-tight text-[#1c2740]">{firstName ? `Hola, ${firstName}` : "Tu venta"}</h1>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p id="tu-venta" className="flex flex-wrap items-center gap-2 text-lg text-[#1c2740]">
            <span className="font-semibold">Tu venta:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-medium ${status.tone}`}>
              <status.Icon className="size-4" aria-hidden />
              {status.label}
            </span>
          </p>
          <p className="text-base leading-relaxed text-[#5c6b78]">
            <span className="font-semibold text-[#1c2740]">Siguiente paso: </span>
            {step.text}
          </p>
        </div>
        {step.href && step.cta ? (
          <Link
            href={step.href}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#0c7c78] px-6 text-base font-semibold text-white hover:bg-[#0a6764] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c7c78]"
          >
            {step.cta}
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function SellerOverview({
  listing,
  payToPublish = false,
  hasPhoto = false,
  interests,
  questions,
  meetings,
  notifications,
  panels,
  series,
  mixes,
  costYears,
  pending,
  sold = false,
  firstName = "",
}: {
  sold?: boolean;
  firstName?: string;
  listing: "missing" | "draft" | "pending" | "published";
  payToPublish?: boolean;
  hasPhoto?: boolean;
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
  // The photo is a recommendation, not a requirement: it never holds the meter back.
  const filled = filledSellerPanels(panels);
  const complete = filled === panelSteps.length;
  const firstMissing = panelSteps.find((item) => !panels[item.key]);
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
      <SaleHero
        firstName={firstName}
        listing={listing}
        sold={sold}
        next={pending[0] ?? null}
        missingHref={firstMissing ? panelHref[firstMissing.key] : null}
      />
      <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="flex w-full min-w-0 flex-col gap-6 self-start">
          <PendingActions items={pending} empty={sellerCopy.pendingEmpty} />
          <section className="w-full rounded-2xl border border-[#e7eaee] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
                {sellerCopy.financeTitle}
                <FieldHint text={sellerCopy.financeIntro} />
              </h2>
              {series.length === 0 ? (
                <Link href="/mi-empresa/detalles" className="text-sm font-medium text-[#2454d6] underline">
                  {sellerCopy.financeOpen}
                </Link>
              ) : null}
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
              <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-[#f3f5f8] px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[#1c2740]">{sellerCopy.activityEmpty}</p>
                <p className="max-w-md text-sm text-[#667085]">{sellerCopy.activityLocked}</p>
                <Link href="/mi-empresa/detalles" className="text-sm font-medium text-[#2454d6] underline">
                  {sellerCopy.fillInfo}
                </Link>
              </div>
            )}
          </section>
        </div>
        <div className="relative w-full xl:min-h-full">
          <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
          <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
            <h2
              className={
                listing === "published"
                  ? "flex items-center gap-2 text-2xl font-semibold text-[#17663a]"
                  : listing === "pending"
                    ? "text-2xl font-semibold text-[#8a6112]"
                    : "flex items-center gap-2 text-2xl font-semibold text-[#c0362c]"
              }
            >
              {listing === "published" || listing === "pending" ? null : (
                <TriangleAlert className="size-6 shrink-0" aria-hidden />
              )}
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
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white p-5">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sellerCopy.notificationsTitle}</h2>
            {notifications.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm font-semibold text-[#1c2740]">{sellerCopy.notificationsEmpty}</p>
                <p className="mt-1 text-sm text-[#667085]">{sellerCopy.notificationsEmptyBody}</p>
              </div>
            ) : (
              <NoticeList items={notifications} scroll icons />
            )}
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}
