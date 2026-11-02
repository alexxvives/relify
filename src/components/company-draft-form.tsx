"use client";

import { MarketCard } from "@/components/market-card";
import type { PublicProjectCard } from "@/lib/public-project";
import { sectorImageSrc, sectorKeyFromCnae } from "@/lib/sector-image";
import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { mergeStatementTable } from "@/lib/statement-merge";
import type { SellerFichaExtras } from "@/server/sellerFichaExtras";
import { rememberSessionFlag, usePanelOpen, useSessionChoice } from "@/components/session-flag";
import { useRouter } from "next/navigation";
import { Plus, Building2, CalendarDays, ChevronDown, ChevronUp, CircleCheck, Clock, FileSpreadsheet, Handshake, Heart, ImagePlus, Info, Lock, LockOpen, MapPin, Pencil, RefreshCw, Users, X } from "lucide-react";
import { sellerCopy } from "@/lib/seller-copy";
import { deleteProjectCoverAction, generateCodenameAction, saveCompanyDraftAction, saveProjectCoverAction, type CompanyDraftState } from "@/app/(app)/mi-empresa/actions";
import { FieldHint } from "@/components/field-hint";
import { InfoHint } from "@/components/ui/info-hint";
import { CompanyBanner } from "@/components/company-banner";
import { bannerChips } from "@/lib/sector-theme";
import { CompanyReport } from "@/components/company-report";
import type { SabiYear } from "@/lib/sabi/insights";
import { OptionSelect } from "@/components/ui/option-select";
import { FloatingSegmentedTabs } from "@/components/seller-tabs";
import { IdentityChangeDialog, LockedIdentityInput, type IdentityField } from "@/components/identity-change";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";
import { cnaeClasses } from "@/lib/cnae-2009";
import { estimatePriceRange, formatMultiple, priceStanding, type PriceEstimate } from "@/lib/valuation-multiples";
import { formatEur, formatEurTrimmed } from "@/lib/money";
import { headcountRanges as valuationHeadcounts, type HeadcountRangeId } from "@/lib/company-profile";
import { projectImageSrc } from "@/lib/project-image";
import { billingCopy } from "@/lib/billing-copy";
import { balanceLabels, companyCopy, incomeLabels } from "@/lib/company-copy";
import { marketCopy } from "@/lib/market-copy";
import { keepPercent, keepSignedEuro, keepUnsignedEuro, keepYear } from "@/lib/numeric-input";
import {
  closedFieldName,
  emptyCompanyDraft,
  eurosToCents,
  forecastFieldName,
  optionalEurosToCents,
  projectSlug,
  saleReasonLabels,
  saleReasons,
  type ClosedYearInput,
  type CompanyDraftInput,
  type ForecastYearInput,
} from "@/lib/company-draft";
import { draftInvestorPreview } from "@/lib/draft-investor-preview";
import {
  anonymousSliceLabel,
  balanceDisplayKeys,
  balanceInputKeys,
  balanceValue,
  descriptionMaxLength,
  ebitdaMarginBasisPoints,
  type SellerFocusPanel,
  formatBasisPoints,
  headcountLabels,
  headcountRanges,
  incomeDisplayKeys,
  incomeValue,
  pnlInputKeys,
  isEmphasisRow,
  maxActivitySlices,
  maxSecondaryCnaes,
  slicePercentIssue,
  statementYearIsBeforeFounding,
  type BalanceAmounts,
  type BalanceDisplayKey,
  type IncomeDisplayKey,
  type PnlAmounts,
  type SliceKind,
} from "@/lib/company-profile";
import { Button as KitButton, Card, Input, Textarea } from "@/components/ui/form";
import { SectionIntro, SellerFiguresCard, StepNumber } from "@/components/seller-figures-card";
import { scrollToCenter } from "@/components/use-scroll-spy";
import { DetailSectionNav, UnsavedBar, type DetailSectionItem } from "@/components/detail-section-nav";
import { saveBlockReason } from "@/lib/seller-save";
import {
  ebitdaAdjustmentLabels,
  ebitdaAdjustmentReasonMax,
  ebitdaAdjustmentTypes,
  formRowAmountCents,
  formRowsFromJson,
  maxEbitdaAdjustments,
  type EbitdaAdjustmentFormRow,
  type EbitdaAdjustmentType,
} from "@/lib/ebitda-adjustments";
import { askingPriceSet, completionProgress, sectionComplete, sellerRequiredFields } from "@/lib/seller-completion";

const cnaeOptions = [
  { value: "", label: companyCopy.cnaeEmpty },
  ...cnaeClasses.map((item) => ({ value: item.code, label: `${item.code} — ${item.title}` })),
];

const headcountOptions = [
  { value: "", label: companyCopy.headcountEmpty },
  ...headcountRanges.map((band) => ({ value: band, label: headcountLabels[band] })),
];

const percentSumMessages = new Set<string>([
  companyCopy.capitalPercentSum,
  companyCopy.productPercentSum,
  companyCopy.clientPercentSum,
]);

const statementInputClassName =
  "h-9 w-full min-w-[7.5rem] rounded-lg border border-[#e1e6ee] bg-white px-2 text-sm tabular-nums text-[#1c2740] outline-none focus-visible:border-[#465ab4] focus-visible:ring-2 focus-visible:ring-[#465ab4]/20";

const signedEuroPattern = /^-?\d{1,12}(,\d{1,2})?$/;
const unsignedEuroPattern = /^\d{1,12}(,\d{1,2})?$/;

function optionalSigned(value: string): number | null {
  const trimmed = value.trim();

  if (!signedEuroPattern.test(trimmed)) {
    return null;
  }

  return eurosToCents(trimmed);
}

function previewPnl(year: ForecastYearInput): PnlAmounts {
  return {
    sales: optionalSigned(year.sales),
    inventoryChange: optionalSigned(year.inventoryChange),
    ownUse: optionalSigned(year.ownUse),
    supplies: optionalSigned(year.supplies),
    otherOperatingIncome: optionalSigned(year.otherOperatingIncome),
    staffCosts: optionalSigned(year.staffCosts),
    otherOperatingCosts: optionalSigned(year.otherOperatingCosts),
    grantIncome: optionalSigned(year.grantIncome),
    provisionSurplus: optionalSigned(year.provisionSurplus),
    assetImpairment: optionalSigned(year.assetImpairment),
    subsidiaryControlLoss: optionalSigned(year.subsidiaryControlLoss),
    negativeDifference: optionalSigned(year.negativeDifference),
    otherResults: optionalSigned(year.otherResults),
    amortization: optionalSigned(year.amortization),
  };
}

function previewBalance(year: ClosedYearInput): BalanceAmounts {
  return {
    currentAssets: optionalSigned(year.currentAssets),
    cash: optionalSigned(year.cash),
    nonCurrentAssets: optionalSigned(year.nonCurrentAssets),
    currentLiabilities: optionalSigned(year.currentLiabilities),
    longTermDebt: optionalSigned(year.longTermDebt),
    nonCurrentLiabilities: optionalSigned(year.nonCurrentLiabilities),
    shortTermDebt: optionalSigned(year.shortTermDebt),
    equity: optionalSigned(year.equity),
  };
}

function latestClosedWithSales(years: ClosedYearInput[]): ClosedYearInput | null {
  let chosen: ClosedYearInput | null = null;
  let chosenYear = Number.NEGATIVE_INFINITY;

  for (const year of years) {
    const number = Number(year.year);

    if (!Number.isInteger(number) || number < chosenYear || year.sales.trim().length === 0) {
      continue;
    }

    chosen = year;
    chosenYear = number;
  }

  return chosen;
}

function marginText(revenue: string, ebitda: string): string {
  if (!unsignedEuroPattern.test(revenue.trim()) || !signedEuroPattern.test(ebitda.trim())) {
    return companyCopy.unavailable;
  }

  const basisPoints = ebitdaMarginBasisPoints(eurosToCents(ebitda), eurosToCents(revenue));
  return basisPoints === null ? companyCopy.unavailable : formatBasisPoints(basisPoints);
}

function Panel({
  id,
  step,
  title,
  intro,
  hint,
  open,
  done,
  dirty,
  onEdit,
  onCollapse,
  fixed = false,
  children,
}: {
  /** t84: always expanded, no collapse/edit toggle (Ficha pública). */
  fixed?: boolean;
  id?: string;
  /** t76: guided numbering on the seller's "Información empresa" tab. */
  step?: number;
  title: string;
  intro?: string;
  hint?: string;
  open: boolean;
  done: boolean;
  dirty: boolean;
  onEdit: () => void;
  onCollapse: () => void;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20 lg:scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
            {step ? <StepNumber value={step} /> : null}
            {title}
            {hint ? <FieldHint text={hint} /> : null}
          </h2>
          {open ? null : intro ? <SectionIntro>{intro}</SectionIntro> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {open && dirty ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2.5 py-1 text-xs font-medium text-[#8a6112]">
              <Pencil className="size-3.5" aria-hidden />
              {companyCopy.unsaved}
            </span>
          ) : (
            <span
              className={
                done
                  ? "inline-flex items-center gap-1 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-xs font-medium text-[#17663a]"
                  : "inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2.5 py-1 text-xs font-medium text-[#8a6112]"
              }
            >
              {done ? <CircleCheck className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
              {done ? companyCopy.doneChip : companyCopy.pendingChip}
            </span>
          )}
          {fixed ? null : open ? (
            <KitButton
              type="button"
              aria-expanded="true"
              onClick={onCollapse}
              tone="outline" size="sm"
>
              <ChevronUp className="size-4" aria-hidden />
              {companyCopy.collapsePanel}
            </KitButton>
          ) : (
            <KitButton
              type="button"
              aria-expanded="false"
              onClick={onEdit}
              tone="outline" size="sm"
>
              <Pencil className="size-3.5" aria-hidden />
              {companyCopy.editPanel}
            </KitButton>
          )}
        </div>
      </div>
      <div className={open ? "mt-4" : "hidden"}>{children}</div>
    </Card>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={companyCopy.removeRow}
      onClick={onClick}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#f0c2c2] bg-white text-[#c0362c] hover:bg-[#fff1f1]"
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}

function groupedEuro(value: string): string {
  const parsed = previewAmount(value);

  if (value.trim().length === 0 || parsed === "—") {
    return value;
  }

  return parsed.replace(/ €$/, "");
}

function FigureField({
  label,
  name,
  value,
  onChange,
  locked = false,
  corner = null,
  unsetText,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (next: string) => void;
  locked?: boolean;
  corner?: ReactNode;
  /** t83: shown instead of "0 €" while the figure is empty or 0 (e.g. "Sin definir" for the price). */
  unsetText?: string;
}) {
  const [editing, setEditing] = useState(false);
  const unset = unsetText !== undefined && !editing && !askingPriceSet(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = editing ? value : groupedEuro(value);
  const amount = shown.length > 0 ? shown : "—";
  const editable = !locked && onChange !== undefined;

  return (
    <MetricTile
      label={label}
      corner={corner}
      action={
        editable ? (
          <button
            type="button"
            aria-label={`Editar ${label}`}
            title={`Editar ${label}`}
            onClick={() => {
              setEditing(true);
              requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
              });
            }}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#465ab4] hover:bg-[#eef2ff] focus-visible:outline-2 focus-visible:outline-[#465ab4]"
          >
            <Pencil className="size-3.5" aria-hidden />
          </button>
        ) : locked ? (
          <span title="Dato de tus cuentas anuales" className="inline-flex size-7 shrink-0 items-center justify-center text-[#98a2b3]">
            <Lock className="size-3.5" aria-hidden />
            <span className="sr-only">Dato de tus cuentas anuales</span>
          </span>
        ) : null
      }
    >
      <input type="hidden" name={name} value={value} />
      {editable && unset ? (
        <span className="text-2xl font-semibold tracking-tight text-[#98a2b3]">{unsetText}</span>
      ) : editable ? (
        <span className="inline-flex max-w-full items-baseline gap-1 whitespace-nowrap">
          <input
            ref={inputRef}
            inputMode="decimal"
            aria-label={label}
            value={shown}
            placeholder="0"
            className="field-sizing-content max-w-full min-w-[3ch] rounded-md border border-transparent bg-transparent px-0 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums outline-none hover:border-[#d5dbe3] focus:border-[#465ab4] focus:bg-white focus:px-1.5"
            onFocus={() => {
              setEditing(true);
            }}
            onBlur={() => {
              setEditing(false);
            }}
            onChange={(event) => {
              onChange(keepUnsignedEuro(event.target.value));
            }}
          />
          <span className="text-2xl font-semibold text-[#1c2740]">€</span>
        </span>
      ) : (
        <span className="whitespace-nowrap text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">
          {amount === "—" ? amount : `${amount}\u00a0€`}
        </span>
      )}
    </MetricTile>
  );
}

function MetricTile({
  label,
  action = null,
  corner = null,
  children,
}: {
  label: string;
  action?: ReactNode;
  corner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[6.5rem] min-w-0 flex-col justify-between gap-3 rounded-2xl border border-[#e7eaee] bg-[#fbfbfc] p-4">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-semibold text-[#667085]">{label}</span>
          {action}
        </div>
        {corner ? <div className="-mr-1 shrink-0">{corner}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * t78: the seller types only the asking price and adjusted EBITDA. Revenue, EBITDA and margin come from the accounts
 * we load (read-only); OPEX is not asked. The server ignores those fields in seller submissions.
 */
function FichaMetrics({
  revenue,
  askingPrice,
  onAskingPrice,
  ebitda,
  adjustedEbitda,
  margin,
  priceStatus = null,
  adjustments,
}: {
  revenue: string;
  askingPrice: string;
  onAskingPrice: (value: string) => void;
  ebitda: string;
  adjustedEbitda: string;
  margin: string;
  priceStatus?: ReactNode;
  adjustments: ReactNode;
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div id="panel-asking-price" className="scroll-mt-24">
        <FigureField label={companyCopy.askingPriceLabel} name="askingPrice" value={askingPrice} onChange={onAskingPrice} corner={priceStatus} unsetText={companyCopy.priceUnset} />
      </div>
      <MetricTile label={companyCopy.ebitdaMarginLabel}>
        <span className="whitespace-nowrap text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{margin}</span>
      </MetricTile>
      <ReadOnlyFigure label={companyCopy.adjustedEbitdaLabel} value={adjustedEbitda} />
      <ReadOnlyFigure label={companyCopy.revenueLabel} value={revenue} />
      <ReadOnlyFigure label={companyCopy.ebitdaLabel} value={ebitda} />
      <div className="sm:col-span-2 lg:col-span-3">{adjustments}</div>
    </div>
  );
}

/**
 * t82: the seller itemises the adjusted EBITDA instead of typing a total. The bridge is a live preview only; the
 * server recomputes it from the stored accounts EBITDA when saving.
 */
function EbitdaAdjustmentsEditor({
  rows,
  onRows,
  baseCents,
  year,
  legacyCents,
}: {
  rows: EbitdaAdjustmentFormRow[];
  onRows: (rows: EbitdaAdjustmentFormRow[]) => void;
  baseCents: number | null;
  year: string | null;
  legacyCents: number | null;
}) {
  const update = (index: number, patch: Partial<EbitdaAdjustmentFormRow>) =>
    onRows(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  const amounts = rows.map((row) => formRowAmountCents(row.amount));
  const sum = amounts.reduce<number>((total, cents) => total + (cents ?? 0), 0);
  const inputClass =
    "h-10 w-full min-w-0 rounded-xl border border-[#d8dee8] bg-white px-3 text-sm text-[#1c2740] focus-visible:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#7fd6cc] focus-visible:outline-none";
  return (
    <section aria-labelledby="ebitda-adjustments-title" className="rounded-2xl border border-[#e7eaee] bg-[#fbfbfc] p-4">
      {/* t83: the + sits right after the title, like every other add icon. */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 id="ebitda-adjustments-title" className="text-sm font-semibold text-[#1c2740]">
            {companyCopy.adjustmentsTitle}
            {year ? <span className="ml-2 font-normal text-[#667085]">· {companyCopy.adjustmentsYear.replace("{year}", year)}</span> : null}
          </h3>
          <AddIconButton
            label={companyCopy.adjustmentsAdd}
            disabled={rows.length >= maxEbitdaAdjustments}
            onClick={() => onRows([...rows, { type: "owner_salary", amount: "", reason: "" }])}
          />
        </div>
        <p className="mt-1 text-sm text-[#667085]">{companyCopy.adjustmentsIntro}</p>
      </div>
      {rows.length === 0 ? (
        legacyCents !== null ? (
          <p className="mt-3 text-sm text-[#667085]">
            <span className="font-semibold text-[#1c2740]">{companyCopy.adjustmentsLegacy}: {formatEur(legacyCents)}.</span>{" "}
            {companyCopy.adjustmentsLegacyNote}
          </p>
        ) : (
          <p className="mt-3 text-sm text-[#667085]">{companyCopy.adjustmentsEmpty}</p>
        )
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((row, index) => (
            <li key={index} className="grid gap-2 rounded-xl border border-[#e7eaee] bg-white p-2 sm:grid-cols-[minmax(0,19rem)_8.5rem_minmax(0,1fr)_2rem] sm:items-center">
              <label className="min-w-0">
                <span className="sr-only">{companyCopy.adjustmentTypeLabel}</span>
                <select
                  value={row.type}
                  onChange={(event) => update(index, { type: event.target.value as EbitdaAdjustmentType })}
                  className={inputClass}
                >
                  {ebitdaAdjustmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {ebitdaAdjustmentLabels[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-0">
                <span className="sr-only">{companyCopy.adjustmentAmountLabel}</span>
                <input
                  inputMode="decimal"
                  value={row.amount}
                  placeholder="+/- €"
                  title={companyCopy.adjustmentAmountHint}
                  aria-invalid={row.amount.trim() !== "" && (amounts[index] === null || amounts[index] === 0)}
                  onChange={(event) => update(index, { amount: keepSignedEuro(event.target.value) })}
                  className={`${inputClass} text-right tabular-nums`}
                />
              </label>
              <label className="min-w-0">
                <span className="sr-only">{companyCopy.adjustmentReasonLabel}</span>
                <input
                  value={row.reason}
                  maxLength={ebitdaAdjustmentReasonMax}
                  placeholder={companyCopy.adjustmentReasonPlaceholder}
                  onChange={(event) => update(index, { reason: event.target.value })}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                aria-label={companyCopy.adjustmentsRemove}
                title={companyCopy.adjustmentsRemove}
                onClick={() => onRows(rows.filter((_, position) => position !== index))}
                className="inline-flex size-8 items-center justify-center justify-self-end rounded-full text-[#667085] hover:bg-[#f2f4f7] hover:text-[#1c2740] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 ? (
        <>
          <p className="mt-2 text-xs text-[#667085]">{companyCopy.adjustmentAmountHint}</p>
          <dl className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums" aria-live="polite">
            <dt className="text-[#667085]">{companyCopy.ebitdaLabel}</dt>
            <dd className="font-semibold text-[#1c2740]">{baseCents === null ? "—" : formatEur(baseCents)}</dd>
            <dt className="text-[#667085]" aria-hidden>→</dt>
            <dt className="text-[#667085]">{companyCopy.adjustmentsTotal}</dt>
            <dd className="font-semibold text-[#1c2740]">{sum > 0 ? "+" : ""}{formatEur(sum)}</dd>
            <dt className="text-[#667085]" aria-hidden>→</dt>
            <dt className="text-[#0f766e]">{companyCopy.adjustedEbitdaLabel}</dt>
            <dd className="font-semibold text-[#0f766e]">{baseCents === null ? "—" : formatEur(baseCents + sum)}</dd>
          </dl>
        </>
      ) : null}
    </section>
  );
}

function ReadOnlyFigure({ label, value }: { label: string; value: string }) {
  const cents = signedEuroPattern.test(value.trim()) ? eurosToCents(value.trim()) : null;
  return (
    <MetricTile
      label={label}
      corner={
        // t80: the read-only note sits beside the tile title, not under the number.
        <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-[#667085]">
          <Lock className="size-3" aria-hidden />
          De tus cuentas
        </span>
      }
    >
      <span className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">
        {cents !== null && cents !== 0 ? <span className={cents < 0 ? "text-[#b42318]" : undefined}>{wholeEur(cents)}</span> : <span className="text-base font-medium text-[#667085]">Pendiente de cargar</span>}
      </span>
    </MetricTile>
  );
}

function adjustmentRowsJson(rows: EbitdaAdjustmentFormRow[]): string {
  return JSON.stringify(rows.map((row) => ({ type: row.type, amount: row.amount.trim().replace(/[.\s]/g, ""), reason: row.reason.trim() })));
}

function euroCentsOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!unsignedEuroPattern.test(trimmed)) return null;
  const cents = eurosToCents(trimmed);
  return Number.isFinite(cents) ? cents : null;
}

function salesGrowth(years: ClosedYearInput[]): number | null {
  const sales = years
    .map((year) => ({ year: Number(year.year), cents: euroCentsOrNull(year.sales) }))
    .filter((row): row is { year: number; cents: number } => Number.isInteger(row.year) && row.cents !== null && row.cents > 0)
    .sort((a, b) => b.year - a.year);
  if (sales.length < 2 || sales[0].year - sales[1].year !== 1) return null;
  return sales[0].cents / sales[1].cents - 1;
}

function wholeEur(cents: number): string {
  return formatEur(cents).replace(/,00 €$/, " €");
}

const standingCopy = {
  below: { text: "Por debajo del rango", short: "Bajo rango", className: "bg-[#eef1fb] text-[#465ab4]" },
  within: { text: "Dentro del rango", short: "En rango", className: "bg-[#e8f6ee] text-[#17663a]" },
  above: { text: "Por encima del rango", short: "Sobre rango", className: "bg-[#fff4e0] text-[#8a5300]" },
} as const;

/** Suggested price as a status pill under the price input; the range and the why live in a popover. */
function PriceStatus({ estimate, askingCents, basis }: { estimate: PriceEstimate | null; askingCents: number | null; basis: string }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const shown = open || pinned;
  const standing = estimate && askingCents !== null && askingCents > 0 ? standingCopy[priceStanding(askingCents, estimate)] : null;
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={shown}
        aria-controls="price-guide"
        onClick={() => setPinned((value) => !value)}
        onBlur={() => setPinned(false)}
        className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] leading-none font-semibold whitespace-nowrap ${standing ? standing.className : "bg-[#f2f4f7] text-[#475467]"}`}
      >
        <span className="sm:hidden">{standing ? standing.short : "Rango"}</span>
        <span className="hidden sm:inline">{standing ? standing.text : "Rango orientativo"}</span>
        <Info className="size-3 shrink-0" aria-hidden />
        <span className="sr-only">{standing ? standing.text : ""} · Ver rango de precio orientativo</span>
      </button>
      {shown ? (
        <div
          id="price-guide"
          role="tooltip"
          className="absolute top-full right-0 z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-2xl border border-[#e6e9f0] bg-white p-4 text-left shadow-[0_18px_40px_-20px_rgba(28,39,64,0.45)]"
        >
          {estimate ? (
            <>
              <p className="text-sm font-semibold text-[#1c2740]">
                Rango estimado: <span className="tabular-nums">{wholeEur(estimate.lowCents)} – {wholeEur(estimate.highCents)}</span>
              </p>
              <p className="mt-1 text-sm leading-6 text-[#3d4a63]">
                En <span className="font-semibold text-[#1c2740]">{estimate.sectorLabel}</span>, las empresas suelen venderse por{" "}
                <span className="tabular-nums">{formatMultiple(estimate.sectorLow)} – {formatMultiple(estimate.sectorHigh)}</span> su {basis}.
              </p>
              {estimate.adjustments.length > 0 ? (
                <p className="mt-1 text-sm leading-6 text-[#3d4a63]">
                  Ajustado por {estimate.adjustments.join(" y ")}: <span className="tabular-nums">{formatMultiple(estimate.multipleLow)} – {formatMultiple(estimate.multipleHigh)}</span>.
                </p>
              ) : null}
              <p className="mt-2 border-t border-[#eef0f4] pt-2 text-xs leading-5 text-[#667085]">
                Referencia orientativa por sector, no es una valoración. El precio lo decides tú.
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-[#3d4a63]">Añade el EBITDA (o sube tus cuentas) y te mostraremos un rango de precio orientativo para tu sector.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CnaeSelect({
  name,
  label,
  value,
  onChange,
  visibleLabel = true,
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visibleLabel?: boolean;
}) {
  const select = (
    <OptionSelect
      name={name}
      label={label}
      value={value}
      options={cnaeOptions}
      searchable
      searchPlaceholder={companyCopy.cnaeSearch}
      emptyLabel={companyCopy.cnaeNoMatch}
      onValueChange={onChange}
    />
  );

  if (!visibleLabel) {
    return select;
  }

  // t84: a plain wrapper (not <label>) so clicks beside the field don't open the dropdown;
  // the label row is h-8 to line up with the "Secundarios" row and its + button.
  return (
    <div className="flex flex-col gap-3 text-sm font-medium">
      <p className="flex h-8 items-center">{label}</p>
      {select}
    </div>
  );
}

function CustomerChoice({
  customerBase,
  onCustomerBase,
}: {
  customerBase: CompanyDraftInput["customerBase"];
  onCustomerBase: (value: Exclude<CompanyDraftInput["customerBase"], "">) => void;
}) {
  const choices = [
    { id: "business", label: companyCopy.customerBusiness },
    { id: "consumer", label: companyCopy.customerConsumer },
    { id: "mixed", label: companyCopy.customerMixed },
  ] as const;
  const note =
    customerBase === "consumer"
      ? companyCopy.customerConsumerNote
      : customerBase === "mixed"
        ? companyCopy.customerMixedNote
        : customerBase === "business"
          ? companyCopy.customerBusinessNote
          : companyCopy.customerUnset;

  return (
    <div className="mb-6 flex flex-col items-center gap-3 text-center" role="group" aria-labelledby="customer-base-label">
      <div className="flex items-center justify-center gap-2">
        <p id="customer-base-label" className="text-sm font-medium">
          {companyCopy.customerPrompt}
        </p>
        <FieldHint text={note} />
      </div>
      <input type="hidden" name="customerBase" value={customerBase} />
      <div className="flex flex-wrap justify-center gap-2">
        {choices.map((choice) => {
          const selected = customerBase === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onCustomerBase(choice.id);
              }}
              className={
                selected
                  ? "inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white"
                  : "inline-flex h-10 items-center rounded-full border border-[#e7eaee] bg-white px-4 text-sm font-medium text-[#2b3b4a]"
              }
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function draftSliceLabel(kind: SliceKind, position: number): string {
  if (kind === "product") {
    return `Producto/Servicio ${position}`;
  }

  return anonymousSliceLabel(kind, position);
}

function PercentRows({
  legend,
  name,
  kind,
  addLabel,
  values,
  onChange,
}: {
  legend: string;
  name: string;
  kind: SliceKind;
  addLabel: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const over = slicePercentIssue(values) === "over";

  const legendId = `${name}-legend`;
  return (
    <div role="group" aria-labelledby={legendId} className="min-w-0">
      <div className="mb-3 flex items-center justify-start gap-2">
        <h3 id={legendId} className="text-base font-semibold text-[#1c2740]">{legend}</h3>
        <AddIconButton
          label={addLabel}
          disabled={values.length >= maxActivitySlices}
          onClick={() => {
            onChange([...values, ""]);
          }}
        />
      </div>
      <div className="flex flex-col gap-3">
      {values.map((value, index) => {
        const mark = over && index === values.length - 1;
        return (
        <div key={`${kind}-${index}`} className="flex items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            {draftSliceLabel(kind, index + 1)}
            <span className="relative block">
              <Input
                name={name}
                inputMode="decimal"
                value={value}
                aria-invalid={mark}
                onChange={(event) => {
                  const next = keepPercent(event.target.value);
                  onChange(values.map((current, currentIndex) => (currentIndex === index ? next : current)));
                }}
                style={mark ? { boxShadow: "0 0 0 2px #c0362c" } : undefined}
                className={`pr-8`}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#64748b]" aria-hidden>
                %
              </span>
            </span>
          </label>
          <RemoveRowButton
            onClick={() => {
              onChange(values.filter((_, currentIndex) => currentIndex !== index));
            }}
          />
        </div>
        );
      })}
      </div>
    </div>
  );
}

/** t80: compact "+" beside a section title instead of a full-width "Añadir …" button. */
function AddIconButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d8dee8] text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Plus className="size-4" aria-hidden />
    </button>
  );
}

function Fact({
  id,
  icon: Icon,
  label,
  required = false,
  children,
}: {
  id?: string;
  icon: typeof Building2;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div id={id} className="grid scroll-mt-6 grid-cols-[2.75rem_minmax(0,1fr)] items-end gap-3">
      <span className="inline-flex size-11 items-center justify-center rounded-md bg-[#eef2ff] p-2.5 text-[#465ab4]">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="mb-1 block text-sm text-[#64748b]">
          {label}
          {required ? (
            <span className="ml-0.5 text-[#c0362c]" aria-hidden>
              *
            </span>
          ) : null}
        </span>
        <div className="text-base font-semibold text-[#2b3b4a]">{children}</div>
      </span>
    </div>
  );
}

function sameList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function incomeSnapshot(year: ForecastYearInput): Record<string, string> {
  const snapshot: Record<string, string> = { year: year.year };

  for (const key of pnlInputKeys) {
    snapshot[key] = year[key];
  }

  return snapshot;
}

function panelStorageKey(id: string): string | null {
  if (id === "basic") {
    return "Relify:panel:basic";
  }
  if (id === "income") {
    return "Relify:panel:income";
  }
  if (id === "balance") {
    return "Relify:panel:balance";
  }
  if (id === "structure") {
    return "Relify:panel:structure";
  }
  if (id === "deal") {
    return "Relify:panel:deal";
  }
  return null;
}

function balanceSnapshot(year: ClosedYearInput): Record<string, string> {
  const snapshot: Record<string, string> = {};

  for (const key of balanceInputKeys) {
    snapshot[key] = year[key];
  }

  return snapshot;
}

export function CompanyDraftForm({
  draft,
  cif,
  focus = null,
  reviewPending = false,
  coverSrc = null,
  financeExtra = null,
  reportYears = null,
  fichaExtras = null,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  focus?: SellerFocusPanel | null;
  reviewPending?: boolean;
  coverSrc?: string | null;
  /** t62: SABI detail block, rendered under the balance sheet. */
  financeExtra?: ReactNode;
  /** t69: imported closed years, so the buyer preview shows the same report charts buyers will see. */
  reportYears?: SabiYear[] | null;
  /** t81: Ratios and result/working-capital rows of the stored accounts, for the buyer preview. */
  fichaExtras?: SellerFichaExtras | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const leaveHrefRef = useRef<string | null>(null);
  const sawLeavePending = useRef(false);
  const initial = draft ?? emptyCompanyDraft();
  const [state, action, pending] = useActionState<CompanyDraftState, FormData>(saveCompanyDraftAction, null);
  const [legalName, setLegalName] = useState(initial.legalName);
  const [address, setAddress] = useState(() => addressWithRegion(initial.address, initial.region));
  const [codename, setCodename] = useState(initial.codename);
  const region = initial.region;
  const [foundedYear, setFoundedYear] = useState(initial.foundedYear);
  const [description, setDescription] = useState(initial.description);
  const [saleReason, setSaleReason] = useState(initial.saleReason);
  const [principalCnae, setPrincipalCnae] = useState(initial.principalCnae);
  const [secondaryCnaes, setSecondaryCnaes] = useState(initial.secondaryCnaes);
  const [revenue] = useState(initial.revenue);
  const [ebitda] = useState(initial.ebitda);
  // t82: itemised adjustments replace the typed adjusted EBITDA. "" in the draft means legacy (never itemised).
  const [adjustmentRows, setAdjustmentRows] = useState<EbitdaAdjustmentFormRow[]>(() => formRowsFromJson(initial.ebitdaAdjustments));
  const adjustmentsJson = adjustmentRowsJson(adjustmentRows);
  const hadAdjustmentList = initial.ebitdaAdjustments.trim() !== "";
  const [opex] = useState(initial.opex);
  const [askingPrice, setAskingPrice] = useState(initial.askingPrice);
  const [capitalPercents, setCapitalPercents] = useState(initial.capitalPercents);
  const [productPercents, setProductPercents] = useState(initial.productPercents);
  const [clientPercents, setClientPercents] = useState(initial.clientPercents);
  const startingCustomer: CompanyDraftInput["customerBase"] =
    initial.customerBase !== "" ? initial.customerBase : initial.clientPercents.length > 0 ? "business" : "";
  const [customerBase, setCustomerBase] = useState(startingCustomer);
  const [headcount, setHeadcount] = useState(initial.headcount);
  const [nif, setNif] = useState(cif);
  const [closedYears, setClosedYears] = useState(initial.closedYears);
  const [forecastYear, setForecastYear] = useState(initial.forecastYear);
  const [storedTab, setStoredTab] = useSessionChoice(
    "Relify:seller-tab",
    focus === "price" ? "deal" : "company",
    ["company", "deal"],
  );
  const [tabPin, setTabPin] = useState<"company" | "deal" | null>(focus === "price" ? "deal" : null);
  const tab = tabPin ?? storedTab;
  const [openBasic, setOpenBasic] = usePanelOpen(
    "Relify:panel:basic",
    focus === null || focus === "identity" || focus === "description" || focus === "cnae",
    focus === "identity" || focus === "description" || focus === "cnae",
  );
  const [openIncome, setOpenIncome] = usePanelOpen("Relify:panel:income", focus === "income", focus === "income");
  const [openBalance, setOpenBalance] = usePanelOpen("Relify:panel:balance", focus === "balance", focus === "balance");
  const [openStructure, setOpenStructure] = usePanelOpen(
    "Relify:panel:structure",
    focus === "structure",
    focus === "structure",
  );
  const [, setListedPhoto] = useState(
    () => Boolean(coverSrc) || projectImageSrc(projectSlug(initial.codename)) !== null,
  );

  const [closedAfterSave, setClosedAfterSave] = useState("");
  const [saveTarget, setSaveTarget] = useState("");
  const [rejectedSave, setRejectedSave] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [suppressStatus, setSuppressStatus] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  // t78: /mi-empresa/detalles is only reachable with a verified NIF (stored CIF); the server enforces the lock too.
  const identityLocked = cif.trim().length > 0;
  const [changeField, setChangeField] = useState<IdentityField | null>(null);
  const saveStamp = state?.saved && !pending && saveTarget.length > 0 ? `${saveTarget}:${attempt}` : "";
  const [saveClosed, setSaveClosed] = useState("");

  if (saveStamp.length > 0 && saveStamp !== closedAfterSave) {
    setClosedAfterSave(saveStamp);
    setSaveClosed(saveTarget);
  }

  useEffect(() => {
    const key = panelStorageKey(saveClosed);
    if (key === null) {
      return;
    }

    rememberSessionFlag(key, false);
  }, [saveClosed]);
  const [baseline, setBaseline] = useState(() => ({
    legalName: initial.legalName,
    address: addressWithRegion(initial.address, initial.region),
    codename: initial.codename,
    region: initial.region,
    foundedYear: initial.foundedYear,
    description: initial.description,
    saleReason: initial.saleReason,
    principalCnae: initial.principalCnae,
    secondaryCnaes: initial.secondaryCnaes,
    nif: cif,
    headcount: initial.headcount,
    capitalPercents: initial.capitalPercents,
    productPercents: initial.productPercents,
    clientPercents: initial.clientPercents,
    customerBase: startingCustomer,
    revenue: initial.revenue,
    ebitda: initial.ebitda,
    adjustedEbitda: initial.adjustedEbitda,
    ebitdaAdjustments: adjustmentRowsJson(formRowsFromJson(initial.ebitdaAdjustments)),
    opex: initial.opex,
    askingPrice: initial.askingPrice,
    closedYears: initial.closedYears,
    forecastYear: initial.forecastYear,
  }));
  const [seenSave, setSeenSave] = useState<CompanyDraftState>(null);
  const currentDraft = {
    legalName,
    address,
    codename,
    region,
    foundedYear,
    description,
    saleReason,
    principalCnae,
    secondaryCnaes,
    nif,
    headcount,
    capitalPercents,
    productPercents,
    clientPercents,
    customerBase,
    revenue,
    ebitda,
    adjustedEbitda: initial.adjustedEbitda,
    ebitdaAdjustments: adjustmentsJson,
    opex,
    askingPrice,
    closedYears,
    forecastYear,
  };

  if (state?.saved && state !== seenSave) {
    setSeenSave(state);
    setBaseline(currentDraft);
  }

  const basicDirty =
    legalName !== baseline.legalName ||
    address !== baseline.address ||
    region !== baseline.region ||
    foundedYear !== baseline.foundedYear ||
    description !== baseline.description ||
    saleReason !== baseline.saleReason ||
    principalCnae !== baseline.principalCnae ||
    nif !== baseline.nif ||
    headcount !== baseline.headcount ||
    !sameList(secondaryCnaes, baseline.secondaryCnaes);
  const structureDirty =
    !sameList(capitalPercents, baseline.capitalPercents) ||
    !sameList(productPercents, baseline.productPercents) ||
    !sameList(clientPercents, baseline.clientPercents) ||
    customerBase !== baseline.customerBase;
  const incomeDirty =
    JSON.stringify(closedYears.map(incomeSnapshot)) !== JSON.stringify(baseline.closedYears.map(incomeSnapshot)) ||
    JSON.stringify(incomeSnapshot(forecastYear)) !== JSON.stringify(incomeSnapshot(baseline.forecastYear));
  const balanceDirty = JSON.stringify(closedYears.map(balanceSnapshot)) !== JSON.stringify(baseline.closedYears.map(balanceSnapshot));
  const dealDirty =
    codename !== baseline.codename ||
    revenue !== baseline.revenue ||
    ebitda !== baseline.ebitda ||
    adjustmentsJson !== baseline.ebitdaAdjustments ||
    opex !== baseline.opex ||
    askingPrice !== baseline.askingPrice;

  function closedIndex(index: number): 0 | 1 | 2 {
    if (index === 1) {
      return 1;
    }

    if (index === 2) {
      return 2;
    }

    return 0;
  }

  function setTab(next: "company" | "deal") {
    setTabPin(null);
    setStoredTab(next);
  }

  function chooseSave(id: string) {
    setSaveTarget(id);
    setRejectedSave("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const native = event.nativeEvent;
    const submitter = native instanceof SubmitEvent ? native.submitter : null;
    const id = submitter instanceof HTMLButtonElement ? submitter.value : saveTarget;
    setSaveTarget(id);
    setAttempt((current) => current + 1);

    const blocked = saveBlockReason([capitalPercents, productPercents, clientPercents]);

    if (!blocked) {
      setRejectedSave("");
      setSuppressStatus(false);
      setClientError(null);
      return;
    }

    event.preventDefault();
    leaveHrefRef.current = null;
    setRejectedSave(id);
    setSuppressStatus(true);
    setClientError(blocked);
    setTab("company");
    setOpenStructure(true);
  }

  useEffect(() => {
    const href = leaveHrefRef.current;
    if (!href) {
      return;
    }

    if (pending) {
      sawLeavePending.current = true;
      return;
    }

    if (!sawLeavePending.current || !state) {
      return;
    }

    sawLeavePending.current = false;
    leaveHrefRef.current = null;
    if (state.saved) {
      router.push(href);
    }
  }, [pending, router, state]);

  function panelRejected(id: string): boolean {
    if (pending) {
      return false;
    }

    if (rejectedSave === id) {
      return true;
    }

    return state !== null && !state.saved && !suppressStatus && saveTarget === id;
  }

  function updateClosed(index: 0 | 1 | 2, key: keyof ClosedYearInput, value: string) {
    setClosedYears((current) => {
      const next: CompanyDraftInput["closedYears"] = [current[0], current[1], current[2]];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function incomeCell(key: IncomeDisplayKey, year: ForecastYearInput, index: number | "forecast", locked: boolean) {
    if (locked) {
      return <span className="block py-1.5 text-right text-sm text-[#98a2b3]">—</span>;
    }

    if (key === "grossMargin" || key === "ebitda" || key === "operatingResult") {
      const value = incomeValue(key, previewPnl(year));
      return (
        <span
          className={
            value === null
              ? "block py-1.5 text-right text-sm tabular-nums text-[#98a2b3]"
              : "block py-1.5 text-right text-sm font-semibold tabular-nums text-[#145c32]"
          }
        >
          {value === null ? "—" : eurosToCentsLabel(value)}
        </span>
      );
    }

    const fieldName = index === "forecast" ? forecastFieldName(key) : closedFieldName(closedIndex(index), key);
    return (
      <input
        name={fieldName}
        inputMode="decimal"
        value={year[key]}
        onChange={(event) => {
          const next = keepSignedEuro(event.target.value);
          if (index === "forecast") {
            setForecastYear((current) => ({ ...current, [key]: next }));
            return;
          }
          updateClosed(closedIndex(index), key, next);
        }}
        className={`${statementInputClassName} text-right`}
      />
    );
  }

  const accountYear = latestClosedWithSales(closedYears);
  const salesFromAccounts = accountYear && unsignedEuroPattern.test(accountYear.sales.trim()) ? accountYear.sales.trim() : null;
  const ebitdaCentsFromAccounts = accountYear ? incomeValue("ebitda", previewPnl(accountYear)) : null;
  // t80: a negative EBITDA is still the real figure (it used to be dropped, so DEALE showed "Pendiente de cargar").
  // Only the price estimate needs a positive basis, and euroCentsOrNull below stays unsigned for that.
  const ebitdaFromAccounts = ebitdaCentsFromAccounts !== null ? eurosToCentsLabel(ebitdaCentsFromAccounts) : null;
  // t82: live bridge base = the stored accounts EBITDA the server will use, else the loaded statements.
  const storedEbitdaCents = signedEuroPattern.test(ebitda.trim()) ? eurosToCents(ebitda.trim()) : null;
  const adjustmentBaseCents =
    storedEbitdaCents !== null && (storedEbitdaCents !== 0 || ebitdaCentsFromAccounts === null) ? storedEbitdaCents : ebitdaCentsFromAccounts;
  const adjustmentSumCents = adjustmentRows.reduce((total, row) => total + (formRowAmountCents(row.amount) ?? 0), 0);
  const legacyAdjustedCents = !hadAdjustmentList && signedEuroPattern.test(initial.adjustedEbitda.trim()) ? eurosToCents(initial.adjustedEbitda.trim()) : 0;
  const adjustedEbitda =
    adjustmentRows.length > 0
      ? adjustmentBaseCents === null
        ? ""
        : eurosToCentsLabel(adjustmentBaseCents + adjustmentSumCents)
      : hadAdjustmentList
        ? "0"
        : initial.adjustedEbitda;
  const adjustedEbitdaCents = euroCentsOrNull(adjustedEbitda);
  const ebitdaBasisCents = adjustedEbitdaCents !== null && adjustedEbitdaCents > 0 ? adjustedEbitdaCents : euroCentsOrNull(ebitdaFromAccounts ?? ebitda);
  const priceEstimate = estimatePriceRange({
    cnae: principalCnae,
    ebitdaCents: ebitdaBasisCents,
    headcount: (valuationHeadcounts as readonly string[]).includes(headcount) ? (headcount as HeadcountRangeId) : null,
    revenueGrowth: salesGrowth(closedYears),
  });
  const dealNote = `${
    accountYear && salesFromAccounts
      ? (ebitdaFromAccounts ? companyCopy.dealReflectsBoth : companyCopy.dealReflectsSales).replace("{year}", accountYear.year)
      : companyCopy.euroHint
  }`;
  // Same banner the investor sees on the ficha: own photo first, else the sector reference photo.
  const ownBanner = coverSrc ?? projectImageSrc(projectSlug(codename));
  const previewBanner = ownBanner
    ? { src: ownBanner, ai: false }
    : principalCnae
      ? { src: sectorImageSrc(sectorKeyFromCnae(principalCnae)), ai: true }
      : null;
  // t76: the buyer-view preview opens on "Tras aceptar el NDA"; the before-NDA view is one click away.
  const [previewOpen, setPreviewOpen] = useState(true);
  const investorPreview = draftInvestorPreview({
    legalName,
    address,
    codename,
    region,
    foundedYear,
    description,
    saleReason,
    principalCnae,
    secondaryCnaes,
    revenue: salesFromAccounts ?? revenue,
    ebitda: ebitdaFromAccounts ?? ebitda,
    adjustedEbitda,
    ebitdaAdjustments: adjustmentsJson,
    askingPrice,
    opex,
    capitalPercents,
    productPercents,
    clientPercents,
    customerBase,
    headcount,
    closedYears,
    forecastYear,
  });
  // t83: the preview tables keep every stored year, not only the form window.
  const previewProject = (() => {
    const { stored = null, ...extras } = fichaExtras ?? {};
    const income = mergeStatementTable(
      { years: investorPreview.incomeYears, rows: investorPreview.incomeRows },
      stored ? { years: stored.incomeYears, rows: stored.incomeRows } : null,
    );
    const balance = mergeStatementTable(
      { years: investorPreview.balanceYears, rows: investorPreview.balanceRows },
      stored ? { years: stored.balanceYears, rows: stored.balanceRows } : null,
    );
    return {
      ...investorPreview,
      ...(reportYears && reportYears.length > 0 ? { reportYears } : {}),
      ...extras,
      incomeYears: income.years,
      incomeRows: income.rows,
      balanceYears: balance.years,
      balanceRows: balance.rows,
    };
  })();
  const statusMessage =
    state && !state.saved && !suppressStatus && !percentSumMessages.has(state.message) ? state.message : null;
  const formDirty = basicDirty || structureDirty || incomeDirty || balanceDirty || dealDirty;

  // t77: section nav, required-items progress and the sticky save bar.
  const figuresLoaded = (reportYears?.length ?? 0) > 0;
  const requiredFields = sellerRequiredFields({
    saleReason,
    description,
    principalCnae,
    customerBase,
    productPercents,
    clientPercents,
    askingPrice,
  });
  // t78: a section is "done" only when all its required fields are (was: structure done as soon as headcount was set).
  const basicDone = sectionComplete(requiredFields, "basic");
  const structureDone = sectionComplete(requiredFields, "structure");
  const priceDone = sectionComplete(requiredFields, "deal");
  const companySections: DetailSectionItem[] = [
    { id: "panel-basic", label: companyCopy.basicTitle, status: basicDirty ? "dirty" : basicDone ? "done" : "pending" },
    { id: "panel-structure", label: companyCopy.structureHeading, status: structureDirty ? "dirty" : structureDone ? "done" : "pending" },
    { id: "panel-figures", label: "Tus cifras", status: figuresLoaded ? "done" : "info" },
    ...(financeExtra ? [{ id: "panel-sabi-registry", label: "Datos del registro", status: "info" as const }] : []),
  ];
  // t79/t80: the right-hand checklist groups each required field under its section. It covers this tab only: the asking
  // price lives on Ficha pública and listing it here (as a separate "Ficha pública" group) confused sellers.
  const companyFields = requiredFields.filter((field) => field.section !== "deal");
  const navProgress = {
    ...completionProgress(companyFields),
    fields: companyFields.map((field) => ({
      id: field.id,
      label: field.label,
      done: field.done,
      group: field.section === "basic" ? "panel-basic" : "panel-structure",
    })),
  };
  const dirtySections = [
    { id: "basic", label: companyCopy.basicTitle, dirty: basicDirty },
    { id: "structure", label: companyCopy.structureHeading, dirty: structureDirty },
    { id: "income", label: "Tus cifras", dirty: incomeDirty || balanceDirty },
    { id: "deal", label: "Ficha pública", dirty: dealDirty },
  ].filter((section) => section.dirty);

  // t78/t79: checklist links open the panel (and tab) that holds the field, then scroll to it.
  function goToMissing(id: string): boolean {
    const field = requiredFields.find((item) => item.id === id);
    if (!field) {
      return false;
    }
    setSaveClosed("");
    if (field.section === "basic") setOpenBasic(true);
    if (field.section === "structure") setOpenStructure(true);
    if (field.section === "deal") {
      setTab("deal");
    }
    window.setTimeout(() => {
      const target = document.getElementById(id);
      if (target) scrollToCenter(target);
      target?.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
    }, 60);
    return true;
  }

  function saveAndLeave(href: string) {
    const form = formRef.current;
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    leaveHrefRef.current = href;
    form.requestSubmit();
  }

  return (
    <>
    <form ref={formRef} action={action} onSubmit={onSubmit} className="flex flex-col gap-4">
      <UnsavedChangesGuard dirty={formDirty} onSave={saveAndLeave} />
      <IdentityChangeDialog field={changeField} values={{ legalName, cif: nif }} onClose={() => setChangeField(null)} />
      <h1 className="text-3xl tracking-tight text-public-ink">{sellerCopy.detailsTitle}</h1>
      <FloatingSegmentedTabs
        label={companyCopy.tabsLabel}
        tabs={[
          { id: "company", label: companyCopy.detailsCompanyTab },
          { id: "deal", label: companyCopy.detailsDealTab },
        ]}
        value={tab}
        onChange={(id) => {
          setTab(id);
          window.scrollTo({ top: 0 });
        }}
      />
      {/* t78: "Tu progreso" belongs to Información empresa only; the Ficha pública tab uses the full width. */}
      <div className={tab === "company" ? "flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-stretch lg:gap-6" : "flex flex-col gap-4"}>
      {tab === "company" ? <DetailSectionNav items={companySections} progress={navProgress} onMissing={goToMissing} /> : null}
      <div className="flex min-w-0 flex-col gap-4">
      {/* t84: bottom spacer so "Ir" can centre fields in the last panels too. */}
      <div className={tab === "company" ? "flex flex-col gap-4 pb-[35vh]" : "hidden"}>
      <Panel
        id="panel-basic"
        step={1}
        title={companyCopy.basicTitle}
        intro="Nombre, motivo de venta, descripción y sector."
        open={saveClosed === "basic" ? false : openBasic}
        dirty={basicDirty}
        done={basicDone}
        onEdit={() => {
          setSaveClosed("");
          setOpenBasic(true);
        }}
        onCollapse={() => setOpenBasic(false)}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {identityLocked ? (
            <>
              <Fact id="panel-identity" icon={Building2} label={companyCopy.factName}>
                <LockedIdentityInput name="legalName" value={legalName} />
              </Fact>
              <Fact icon={FileSpreadsheet} label={companyCopy.factNif}>
                <LockedIdentityInput name="cif" value={nif} onRequest={() => setChangeField("cif")} />
              </Fact>
            </>
          ) : (
            <>
              <Fact id="panel-identity" icon={Building2} label={companyCopy.factName}>
                <Input name="legalName" value={legalName} onChange={(event) => setLegalName(event.target.value)} />
              </Fact>
              <Fact icon={FileSpreadsheet} label={companyCopy.factNif}>
                <Input
                  name="cif"
                  value={nif}
                  spellCheck={false}
                  autoCapitalize="characters"
                  onChange={(event) => setNif(event.target.value.toUpperCase())}
                />
              </Fact>
            </>
          )}
          <Fact icon={MapPin} label={companyCopy.addressLabel}>
            <Input
              name="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </Fact>
          <input type="hidden" name="region" value={region} />
          <Fact icon={CalendarDays} label={companyCopy.foundedYearLabel}>
            <Input
              name="foundedYear"
              inputMode="numeric"
              value={foundedYear}
              onChange={(event) => setFoundedYear(keepYear(event.target.value))}
            />
          </Fact>
          <Fact id="panel-sale-reason" icon={Handshake} label={companyCopy.saleReasonLabel} required>
            <OptionSelect
              key={saleReason === "" && panelRejected("basic") ? `sale-reason-${attempt}` : "sale-reason"}
              name="saleReason"
              label={companyCopy.saleReasonLabel}
              value={saleReason}
              invalid={saleReason === "" && panelRejected("basic")}
              options={[
                { value: "", label: companyCopy.saleReasonEmpty },
                ...saleReasons.map((reason) => ({ value: reason, label: saleReasonLabels[reason] })),
              ]}
              onValueChange={(value) => {
                if (value === "" || saleReasons.includes(value as (typeof saleReasons)[number])) {
                  setSaleReason(value as typeof saleReason);
                }
              }}
            />
          </Fact>
          <Fact icon={Users} label={companyCopy.workersLabel}>
            <OptionSelect
              name="headcount"
              label={companyCopy.headcountLabel}
              value={headcount}
              options={headcountOptions}
              onValueChange={(value) => setHeadcount(readHeadcount(value))}
            />
          </Fact>
        </div>
        <div id="panel-description" className="mt-6 flex scroll-mt-6 flex-col gap-2">
          <span className="flex items-center gap-2 text-base font-semibold text-[#1c2740]">
            {companyCopy.descriptionLabel}
            <span className="text-[#c0362c]" aria-hidden>
              *
            </span>
            <span className="sr-only">(obligatorio)</span>
            {description.length > 80 ? <InfoHint text={companyCopy.descriptionProgress} icon="warning" tone="warning" /> : null}
            <FieldHint text={companyCopy.descriptionGuide} />
          </span>
          <Textarea
            name="description"
            rows={4}
            maxLength={descriptionMaxLength}
            placeholder={companyCopy.descriptionPlaceholder}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-label={companyCopy.descriptionLabel}
            aria-required="true"
          />
          <span className="flex items-start justify-end gap-4 text-sm text-[#667085]">
            <span>
              {description.length} / {descriptionMaxLength}
            </span>
          </span>
        </div>
        <div id="panel-cnae" className="grid scroll-mt-6 gap-4 md:grid-cols-2">
          <CnaeSelect name="principalCnae" label={companyCopy.principalCnaeLabel} value={principalCnae} onChange={setPrincipalCnae} />
          <div className="flex flex-col gap-3">
            <div className="flex h-8 items-center justify-start gap-2">
              <p className="text-sm font-medium">
                {companyCopy.secondaryCnaeLabel} (máximo {maxSecondaryCnaes})
              </p>
              <AddIconButton
                label={companyCopy.addSecondaryCnae}
                disabled={secondaryCnaes.length >= maxSecondaryCnaes}
                onClick={() => {
                  setSecondaryCnaes((current) => [...current, ""]);
                }}
              />
            </div>
            {secondaryCnaes.map((code, index) => (
              <div key={`secondary-${index}`} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <CnaeSelect
                    name="secondaryCnae"
                    label={`${companyCopy.secondaryCnaeItem} ${index + 1}`}
                    visibleLabel={false}
                    value={code}
                    onChange={(value) => {
                      setSecondaryCnaes((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
                    }}
                  />
                </div>
                <RemoveRowButton
                  onClick={() => {
                    setSecondaryCnaes((current) => current.filter((_, itemIndex) => itemIndex !== index));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        id="panel-structure"
        step={2}
        title={companyCopy.structureHeading}
        intro={companyCopy.structureFold}
        hint={companyCopy.slicePrivate}
        open={saveClosed === "structure" ? false : openStructure}
        dirty={structureDirty}
        done={structureDone}
        onEdit={() => {
          setSaveClosed("");
          setOpenStructure(true);
        }}
        onCollapse={() => setOpenStructure(false)}
      >
        <div id="panel-customer" className="scroll-mt-24">
          <CustomerChoice customerBase={customerBase} onCustomerBase={setCustomerBase} />
        </div>
        <div className="mb-6 border-t border-[#d7dde6]" />
        {customerBase === "business" || customerBase === "mixed"
          ? null
          : clientPercents.map((value, index) => (
              <input key={`kept-client-${index}`} type="hidden" name="clientPercent" value={value} />
            ))}
        {/* t75: shareholders live in their own panel; stored capital slices ride along unchanged. */}
        {capitalPercents.map((value, index) => (
          <input key={`kept-capital-${index}`} type="hidden" name="capitalPercent" value={value} />
        ))}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div id="panel-product-split" className="scroll-mt-24">
          <PercentRows
            legend={companyCopy.productsLegend}
            name="productPercent"
            kind="product"
            addLabel={companyCopy.addProduct}
            values={productPercents}
            onChange={setProductPercents}
          />
          </div>
          {customerBase === "business" || customerBase === "mixed" ? (
            <div id="panel-client-split" className="scroll-mt-24">
            <PercentRows
              legend={companyCopy.clientsLegend}
              name="clientPercent"
              kind="client"
              addLabel={companyCopy.addClient}
              values={clientPercents}
              onChange={setClientPercents}
            />
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>
      </Panel>

      <SellerFiguresCard step={3} figures={investorPreview} reportYears={reportYears} />
      {/* t76: raw accounting inputs are not for sellers; they stay mounted (hidden) so saving keeps the loaded values. */}
      <div hidden>
      <Panel
        id="panel-income"
        title={companyCopy.incomeHeading}
        intro={companyCopy.incomeFold}
        hint={`${companyCopy.incomeIntro} ${companyCopy.signedEuroHint}\n\n${companyCopy.incomeWindowNote}`}
        open={saveClosed === "income" ? false : openIncome}
        dirty={incomeDirty}
        done={closedYears.some((year) => year.sales.trim().length > 0)}
        onEdit={() => {
          setSaveClosed("");
          setOpenIncome(true);
        }}
        onCollapse={() => setOpenIncome(false)}
      >
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#667085]">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-sm bg-[#b7e0c8]" />
            {companyCopy.calculatedMark}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-sm bg-[#c5d0f5]" />
            {companyCopy.forecastMark}
          </span>
        </div>
        <div className="layout-table rounded-xl border border-[#e7eaee]">
          <table className="border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#f6f7f9]" />
                {closedYears.map((year, index) => (
                  <th key={`closed-mark-${index}`} className="bg-[#f6f7f9]" />
                ))}
                <th className="bg-[#eef2ff] px-2 pt-3 pb-1 text-center text-xs font-medium text-[#465ab4]">
                  {companyCopy.forecastMark}
                </th>
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-[#f6f7f9] px-3 py-3 text-left font-medium text-[#2b3b4a]">
                  {companyCopy.evolutionLabel}
                </th>
                {closedYears.map((year, index) => {
                  const locked = statementYearIsBeforeFounding(year.year, foundedYear);
                  return (
                    <th key={`closed-year-${index}`} className="bg-[#f6f7f9] px-2 py-2">
                      {locked ? (
                        <span className="block px-1 text-center text-xs leading-4 font-medium text-[#98a2b3]">
                          {year.year}
                          <span className="mt-1 block">{companyCopy.beforeFounding}</span>
                        </span>
                      ) : (
                        <input
                          name={closedFieldName(closedIndex(index), "year")}
                          value={year.year}
                          inputMode="numeric"
                          onChange={(event) => updateClosed(closedIndex(index), "year", keepYear(event.target.value))}
                          aria-label={`Año cerrado ${index + 1}`}
                          className={`${statementInputClassName} text-center`}
                        />
                      )}
                    </th>
                  );
                })}
                <th className="bg-[#eef2ff] px-2 py-2">
                  <input
                    name={forecastFieldName("year")}
                    value={forecastYear.year}
                    inputMode="numeric"
                    onChange={(event) => setForecastYear((current) => ({ ...current, year: keepYear(event.target.value) }))}
                    aria-label={companyCopy.forecastMark}
                    className={`${statementInputClassName} text-center`}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {incomeDisplayKeys.map((key, rowIndex) => {
                const emphasis = isEmphasisRow(key);
                const rowBg = emphasis ? "bg-[#f3faf6]" : rowIndex % 2 === 0 ? "bg-white" : "bg-[#f8f9fb]";
                return (
                  <tr key={key}>
                    <th
                      className={`sticky left-0 z-10 min-w-56 border-b border-[#eef0f3] px-3 py-2 text-left ${rowBg} ${emphasis ? "font-semibold text-[#145c32]" : "font-medium text-[#2b3b4a]"}`}
                    >
                      {incomeLabels[key]}
                    </th>
                    {closedYears.map((year, index) => (
                      <td key={`${key}-${index}`} className={`border-b border-[#eef0f3] px-2 py-1.5 ${rowBg}`}>
                        {incomeCell(key, year, closedIndex(index), statementYearIsBeforeFounding(year.year, foundedYear))}
                      </td>
                    ))}
                    <td className={`border-b border-[#eef0f3] px-2 py-1.5 ${emphasis ? "bg-[#e5f4ec]" : "bg-[#eef2ff]"}`}>
                      {incomeCell(key, forecastYear, "forecast", statementYearIsBeforeFounding(forecastYear.year, foundedYear))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        id="panel-balance"
        title={companyCopy.balanceHeading}
        intro={companyCopy.balanceFold}
        hint={companyCopy.balanceIntro}
        open={saveClosed === "balance" ? false : openBalance}
        dirty={balanceDirty}
        done={closedYears.some((year) => year.currentAssets.trim().length > 0 || year.equity.trim().length > 0)}
        onEdit={() => {
          setSaveClosed("");
          setOpenBalance(true);
        }}
        onCollapse={() => setOpenBalance(false)}
      >
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#667085]">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-sm bg-[#b7e0c8]" />
            {companyCopy.calculatedMark}
          </span>
        </div>
        <div className="layout-table rounded-xl border border-[#e7eaee]">
          <table className="border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#f6f7f9] px-3 py-3 text-left font-medium text-[#2b3b4a]">
                  {companyCopy.evolutionLabel}
                </th>
                {closedYears.map((year, index) => {
                  const locked = statementYearIsBeforeFounding(year.year, foundedYear);
                  return (
                    <th key={`balance-year-${index}`} className="bg-[#f6f7f9] px-3 py-3 text-right font-medium text-[#2b3b4a]">
                      {locked ? (
                        <span className="block text-xs leading-4 font-medium text-[#98a2b3]">
                          {year.year || companyCopy.unavailable}
                          <span className="mt-1 block">{companyCopy.beforeFounding}</span>
                        </span>
                      ) : (
                        year.year || companyCopy.unavailable
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {balanceDisplayKeys.map((key, rowIndex) => {
                const emphasis = isEmphasisRow(key);
                const rowBg = emphasis ? "bg-[#f3faf6]" : rowIndex % 2 === 0 ? "bg-white" : "bg-[#f8f9fb]";
                return (
                  <tr key={key}>
                    <th
                      className={`sticky left-0 z-10 min-w-56 border-b border-[#eef0f3] px-3 py-2 text-left ${rowBg} ${emphasis ? "font-semibold text-[#145c32]" : "font-medium text-[#2b3b4a]"}`}
                    >
                      {balanceLabels[key]}
                    </th>
                    {closedYears.map((year, index) => (
                      <td key={`${key}-${index}`} className={`border-b border-[#eef0f3] px-2 py-1.5 ${rowBg}`}>
                        {statementYearIsBeforeFounding(year.year, foundedYear) ? (
                          <span className="block py-1.5 text-right text-sm text-[#98a2b3]">—</span>
                        ) : (
                          <BalanceCell
                            rowKey={key}
                            year={year}
                            onChange={(value) => {
                              if (key === "totalAssets" || key === "totalLiabilities") {
                                return;
                              }
                              updateClosed(closedIndex(index), key, keepSignedEuro(value));
                            }}
                            name={closedFieldName(closedIndex(index), key === "totalAssets" || key === "totalLiabilities" ? "year" : key)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      </div>
      {financeExtra}
      {/* t80: room so the last sections can scroll up to the top from the progress panel. */}
      <div aria-hidden className="hidden h-[40vh] lg:block" />
      </div>

      <div className={tab === "deal" ? "flex flex-col gap-4" : "hidden"}>
      {reviewPending ? (
        <p className="rounded-2xl bg-[#e6f6f4] px-4 py-3 text-sm font-medium text-[#0f766e]">{billingCopy.reviewPending}</p>
      ) : null}
      <Panel
        id="panel-price"
        title={companyCopy.detailsDealTab}
        intro={companyCopy.dealFold}
        hint={dealNote}
        open
        fixed
        dirty={dealDirty}
        done={priceDone}
        onEdit={() => setSaveClosed("")}
        onCollapse={() => undefined}
      >
        <PublicFicha
          codename={codename}
          coverSrc={coverSrc}
          onListed={setListedPhoto}
          onCodename={setCodename}
          region={region}
          revenue={salesFromAccounts ?? revenue}
          ebitda={ebitdaFromAccounts ?? ebitda}
          adjustedEbitda={adjustedEbitda}
          askingPrice={askingPrice}
          principalCnae={principalCnae}
          summary={description}
        >
          <FichaMetrics
            revenue={salesFromAccounts ?? revenue}
            askingPrice={askingPrice}
            onAskingPrice={setAskingPrice}
            ebitda={ebitdaFromAccounts ?? ebitda}
            adjustedEbitda={adjustedEbitda}
            adjustments={
              <>
                <input type="hidden" name="ebitdaAdjustments" value={adjustmentsJson} />
                <EbitdaAdjustmentsEditor
                  rows={adjustmentRows}
                  onRows={setAdjustmentRows}
                  baseCents={adjustmentBaseCents}
                  year={accountYear?.year ?? null}
                  legacyCents={legacyAdjustedCents !== 0 ? legacyAdjustedCents : null}
                />
              </>
            }
            margin={marginText(salesFromAccounts ?? revenue, ebitdaFromAccounts ?? ebitda)}
            priceStatus={
              <PriceStatus
                estimate={priceEstimate}
                askingCents={euroCentsOrNull(askingPrice)}
                basis={adjustedEbitdaCents !== null && adjustedEbitdaCents > 0 ? "EBITDA ajustado" : "EBITDA"}
              />
            }
          />
        </PublicFicha>
        <div id="ficha-detalles" className="mt-8 flex scroll-mt-24 flex-col gap-4">
          <span className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
            {companyCopy.openFichaTitle}
            <FieldHint text={companyCopy.openFichaHint} />
          </span>
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e6e9f0] bg-white p-4">
            <div role="radiogroup" aria-label="Vista previa" className="grid min-w-0 flex-1 grid-cols-2 rounded-full border border-[#d5dbe3] bg-[#f5f6f8] p-1 sm:inline-flex sm:flex-none">
              {[
                { open: false, label: companyCopy.previewBefore, short: "Antes", Icon: Lock },
                { open: true, label: companyCopy.previewAfter, short: "Tras el NDA", Icon: LockOpen },
              ].map(({ open, label, short, Icon }) => (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={previewOpen === open}
                  onClick={() => setPreviewOpen(open)}
                  className={`inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold whitespace-nowrap transition sm:px-3 sm:text-sm ${previewOpen === open ? "bg-white text-[#1c2740] shadow-sm" : "text-[#667085] hover:text-[#1c2740]"}`}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <InfoHint text={companyCopy.previewLockNote} icon="info" align="end" width="lg" />
          </div>
          <CompanyBanner
            heading="p"
            title={investorPreview.codename.trim().length > 0 ? investorPreview.codename : companyCopy.codenameLabel}
            image={previewBanner}
            sector={principalCnae ? sectorKeyFromCnae(principalCnae) : null}
            chips={bannerChips({ sector: principalCnae ? sectorKeyFromCnae(principalCnae) : null, region: investorPreview.region, foundedYear })}
          />
          <CompanyReport project={previewProject} sellerPreview={{
            mixAction: (
              <KitButton
                type="button"
                tone="outline"
                size="sm"
                onClick={() => {
                  setTab("company");
                  setOpenStructure(true);
                  requestAnimationFrame(() => document.getElementById("panel-structure")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                }}
              >
                {companyCopy.fillMixAction}
              </KitButton>
            ),
          }} role="buyer" figuresOpen={previewOpen} lockedNote={companyCopy.previewLockedSeller} navBelowTabs />
        </div>
      </Panel>
      </div>
      <UnsavedBar
        sections={dirtySections.map((section) => section.label)}
        saving={pending}
        rejected={dirtySections.length > 0 && panelRejected(dirtySections[0].id)}
        shake={attempt}
        value={dirtySections[0]?.id ?? "basic"}
        onChoose={chooseSave}
        error={pending ? null : (clientError ?? (state && !state.saved ? state.message : null))}
        savedStamp={state?.saved && !pending ? attempt : null}
      />
      </div>
      </div>

      {statusMessage ? (
        <p role={state?.saved ? "status" : "alert"} className={state?.saved ? "text-sm" : "text-sm text-destructive"}>
          {statusMessage}
        </p>
      ) : null}
    </form>
    </>
  );
}

function addressWithRegion(address: string, region: string): string {
  const place = region.trim();
  const street = address.trim();
  if (place.length === 0) {
    return street;
  }
  if (street.toLocaleLowerCase("es-ES").includes(place.toLocaleLowerCase("es-ES"))) {
    return street;
  }
  return street.length === 0 ? place : `${street}, ${place}`;
}

const cardPhotoLimit = 4;
const cardPhotoBytes = 8 * 1024 * 1024;

function PublicFicha({
  codename,
  coverSrc,
  onListed,
  onCodename,
  region,
  revenue,
  ebitda,
  adjustedEbitda,
  askingPrice,
  principalCnae = "",
  summary = "",
  children,
}: {
  codename: string;
  coverSrc: string | null;
  onListed: (listed: boolean) => void;
  onCodename: (value: string) => void;
  region: string;
  revenue: string;
  ebitda: string;
  adjustedEbitda: string;
  askingPrice: string;
  principalCnae?: string;
  summary?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [regenerating, startRegenerate] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [coverHidden, setCoverHidden] = useState(false);
  const [focus, setFocus] = useState("50% 50%");
  const [focusOpen, setFocusOpen] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const imageSrc = projectImageSrc(projectSlug(codename));
  const storedCover = coverHidden ? null : coverSrc;
  const shown = photos[active] ?? storedCover ?? imageSrc;
  const recommended = photos.length === 0 && !coverSrc && !imageSrc;

  function storePhotos(next: string[]) {
    setPhotos(next);
    setActive((current) => Math.min(current, Math.max(next.length - 1, 0)));
    onListed(next.length > 0 || Boolean(storedCover) || Boolean(imageSrc));
    if (next.length === 0 && storedCover) {
      setCoverHidden(true);
      void deleteProjectCoverAction();
    }
  }

  async function uploadCover(file: File) {
    const body = new FormData();
    body.set("cover", file);
    const result = await saveProjectCoverAction(body);

    if (!result.ok) {
      setPhotoMessage(result.message);
      return;
    }

    onListed(true);
    router.refresh();
  }

  async function addPhotos(files: File[]) {
    const room = cardPhotoLimit - photos.length;
    if (room <= 0) {
      setPhotoMessage(companyCopy.cardPhotosLimit);
      return;
    }

    const accepted = files.slice(0, room);
    if (files.length > room) {
      setPhotoMessage(companyCopy.cardPhotosLimit);
    } else {
      setPhotoMessage(null);
    }

    const next: string[] = [];
    for (const file of accepted) {
      if (!file.type.startsWith("image/")) {
        setPhotoMessage(companyCopy.cardPhotosType);
        continue;
      }
      if (file.size > cardPhotoBytes) {
        setPhotoMessage(companyCopy.cardPhotosLarge);
        continue;
      }
      try {
        next.push(await readCardPhoto(file));
      } catch {
        setPhotoMessage(companyCopy.cardPhotosType);
      }
    }

    if (next.length === 0) {
      return;
    }

    const first = accepted[0];

    if (photos.length === 0 && first) {
      void uploadCover(first);
    }

    storePhotos([...photos, ...next].slice(0, cardPhotoLimit));
  }

  return (
    <>
      <span className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
        {companyCopy.fichaFieldsTitle}
      </span>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-[#2b3b4a]">
            <label htmlFor="project-codename">{companyCopy.codenameLabel}</label>
            <FieldHint text={companyCopy.codenameHint} />
          </span>
          <div className="flex items-center gap-2">
            <Input
              id="project-codename"
              name="codename"
              required
              readOnly
              value={codename}
              className={`min-w-0 flex-1 bg-[#f7f8fb] text-[#1c2740]`}
            />
            <button
              type="button"
              disabled={regenerating}
              onClick={() => {
                startRegenerate(async () => {
                  onCodename(await generateCodenameAction(codename));
                });
              }}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#d5dbe3] bg-white px-3 text-sm font-medium text-[#465ab4] hover:bg-[#f4f7ff] disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${regenerating ? "animate-spin" : ""}`} aria-hidden />
              {companyCopy.codenameRegenerate}
            </button>
          </div>
        </div>
        <div id="fotos" className="flex scroll-mt-24 flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-[#2b3b4a]">
            {companyCopy.cardPhotos}
            <FieldHint text={companyCopy.cardPhotosHint} />
            {recommended ? (
              <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-xs font-semibold text-[#8a6112]">
                {companyCopy.cardPhotosRecommended}
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fileRef.current?.click();
              }}
              className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#2b3b4a]"
            >
              <ImagePlus className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{companyCopy.cardPhotos}</span>
            </button>
            {(() => {
              const uploaded = photos.length > 0 ? photos : storedCover ? [storedCover] : [];
              if (uploaded.length === 0) {
                return shown ? (
                  <button
                    type="button"
                    aria-label={companyCopy.cardPhotos}
                    onClick={() => {
                      setFocusOpen(true);
                    }}
                    className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-[#e7eaee]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shown} alt="" className="size-full object-cover" style={{ objectPosition: focus }} />
                  </button>
                ) : null;
              }
              return (
                <ul className="mr-1.5 flex shrink-0 items-center gap-2">
                  {uploaded.map((photo, index) => (
                    <li key={`${index}-${photo.slice(-24)}`} className="relative size-11 shrink-0">
                      <button
                        type="button"
                        aria-pressed={index === active}
                        aria-label={`${companyCopy.cardPhotos} ${index + 1}`}
                        onClick={() => {
                          setActive(index);
                          setFocusOpen(true);
                        }}
                        className={
                          index === active
                            ? "size-11 overflow-hidden rounded-xl border-2 border-[#465ab4]"
                            : "size-11 overflow-hidden rounded-xl border border-[#e7eaee]"
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt="" className="size-full object-cover" style={{ objectPosition: focus }} />
                      </button>
                      <button
                        type="button"
                        aria-label={companyCopy.cardPhotosRemove}
                        onClick={() => {
                          if (photos.length === 0) {
                            setCoverHidden(true);
                            void deleteProjectCoverAction();
                            onListed(Boolean(imageSrc));
                            return;
                          }
                          storePhotos(photos.filter((_, itemIndex) => itemIndex !== index));
                        }}
                        className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#c0362c] text-white shadow-sm"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            aria-label={companyCopy.cardPhotos}
            onChange={(event) => {
              const files = event.target.files ? Array.from(event.target.files) : [];
              event.target.value = "";
              void addPhotos(files);
            }}
          />
          {photoMessage ? (
            <p role="alert" className="text-sm text-[#c0362c]">
              {photoMessage}
            </p>
          ) : null}
          {focusOpen && shown ? (
            <button
              type="button"
              className="relative h-64 overflow-hidden rounded-xl border border-[#e7eaee]"
              onClick={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const x = Math.round(((event.clientX - bounds.left) / bounds.width) * 100);
                const y = Math.round(((event.clientY - bounds.top) / bounds.height) * 100);
                setFocus(`${x}% ${y}%`);
                setFocusOpen(false);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shown} alt="" className="size-full object-contain" />
            </button>
          ) : null}
        </div>
      </div>
      {children}
      <MarketPreview
        codename={codename}
        region={region}
        revenue={revenue}
        ebitda={ebitda}
        adjustedEbitda={adjustedEbitda}
        askingPrice={askingPrice}
        principalCnae={principalCnae}
        summary={summary}
      />
    </>
  );
}

function MarketPreview({
  codename,
  region,
  revenue,
  ebitda,
  adjustedEbitda,
  askingPrice,
  principalCnae = "",
  summary = "",
}: {
  codename: string;
  region: string;
  revenue: string;
  ebitda: string;
  adjustedEbitda: string;
  askingPrice: string;
  principalCnae?: string;
  summary?: string;
}) {
  // The preview is the real marketplace card, so it can never drift from it.
  const card: PublicProjectCard = {
    slug: "vista-previa",
    codename: codename.trim().length > 0 ? codename : companyCopy.codenameLabel,
    region: region.trim().length > 0 ? region : companyCopy.regionLabel,
    revenueCents: previewCents(revenue) ?? 0,
    ebitdaCents: signedEuroPattern.test(ebitda.trim()) ? eurosToCents(ebitda.trim()) : 0,
    adjustedEbitdaCents: previewCents(adjustedEbitda) ?? 0,
    askingPriceCents: previewCents(askingPrice) ?? 0,
    sectorKey: principalCnae ? sectorKeyFromCnae(principalCnae) : undefined,
    cnaeCode: principalCnae || null,
    summary: summary.trim() || null,
  };

  const filters = [
    { label: marketCopy.searchLabel, value: marketCopy.searchPlaceholder },
    { label: marketCopy.regionLabel, value: marketCopy.regionAll },
    { label: marketCopy.revenueLabel, value: marketCopy.revenueBands.any },
    { label: marketCopy.ebitdaLabel, value: marketCopy.ebitdaBands.any },
    { label: marketCopy.sortLabel, value: marketCopy.sorts.recommended },
  ];

  return (
    <div className="mt-6 flex flex-col gap-3">
      <span className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
        {companyCopy.marketPreviewTitle}
        <FieldHint text={companyCopy.cardPreviewBody} />
      </span>
      <div className="rounded-2xl border border-[#e7eaee] bg-[#f7f8fb] p-4">
        <div className="grid gap-3 lg:grid-cols-5">
          {filters.map((filter) => (
            <div key={filter.label} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[#5c6b78]">{filter.label}</span>
              <span className="flex h-11 items-center justify-between gap-2 rounded-xl border border-[#e1e6ee] bg-white px-3 text-sm text-[#1c2740]">
                <span className="truncate">{filter.value}</span>
                <ChevronDown className="size-4 shrink-0 text-[#5c6b78]" aria-hidden />
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid items-stretch gap-4 md:grid-cols-3">
          <SampleListing side="left" />
          <div className="relative h-full rounded-2xl shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)]">
            <div inert className="h-full">
            <MarketCard
              priceUnset={companyCopy.priceUnset}
              project={card}
              actions={
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-[#5c6b78]">
                  <Heart className="size-4" aria-hidden />
                </span>
              }
            />
            </div>
            {/* The whole card, photo included, opens the details preview below, as it would for an investor. */}
            <button
              type="button"
              aria-label={companyCopy.openFichaTitle}
              onClick={() => {
                document.getElementById("ficha-detalles")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="absolute inset-0 z-30 cursor-pointer rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-[#5c4de0]/35"
            />
          </div>
          <SampleListing side="right" />
        </div>
      </div>
    </div>
  );
}

/** Neighbouring listings beside the seller's card: the real MarketCard with sample figures, blurred so it stays a backdrop. */
const sampleListings: Record<"left" | "right", PublicProjectCard> = {
  left: { slug: "muestra-1", codename: "Taller Norte", region: "Madrid", revenueCents: 120_000_000, ebitdaCents: 18_000_000, adjustedEbitdaCents: 0, askingPriceCents: 72_000_000, sectorKey: "industria", cnaeCode: null, summary: "Taller de mecanizado con clientes industriales recurrentes." },
  right: { slug: "muestra-2", codename: "Clínica Mar", region: "Valencia", revenueCents: 85_000_000, ebitdaCents: 15_000_000, adjustedEbitdaCents: 0, askingPriceCents: 60_000_000, sectorKey: "salud", cnaeCode: null, summary: "Clínica de fisioterapia con equipo consolidado." },
};

function SampleListing({ side }: { side: keyof typeof sampleListings }) {
  return (
    <div aria-hidden inert className="pointer-events-none h-full blur-[2px] select-none">
      <MarketCard project={sampleListings[side]} muted />
    </div>
  );
}

function readCardPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error("read"));
    };
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("read"));
        return;
      }
      const image = new window.Image();
      image.onerror = () => {
        reject(new Error("image"));
      };
      image.onload = () => {
        const max = 960;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas"));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function previewCents(value: string): number | null {
  const trimmed = value.trim();
  if (!unsignedEuroPattern.test(trimmed)) {
    return null;
  }

  return optionalEurosToCents(trimmed);
}

function previewAmount(value: string): string {
  const trimmed = value.trim();
  if (!/^-?\d{1,12}(,\d{1,2})?$/.test(trimmed)) {
    return "—";
  }

  return formatEurTrimmed(optionalEurosToCents(trimmed) ?? 0);
}


function eurosToCentsLabel(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const whole = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const body = fraction === 0 ? String(whole) : `${whole},${String(fraction).padStart(2, "0")}`;
  return negative ? `-${body}` : body;
}

function readHeadcount(value: string): CompanyDraftInput["headcount"] {
  const match = headcountRanges.find((band) => band === value);
  return match ?? "";
}

function BalanceCell({
  rowKey,
  year,
  name,
  onChange,
}: {
  rowKey: BalanceDisplayKey;
  year: ClosedYearInput;
  name: string;
  onChange: (value: string) => void;
}) {
  if (rowKey === "totalAssets" || rowKey === "totalLiabilities") {
    const value = balanceValue(rowKey, previewBalance(year));
    return (
      <span
        className={
          value === null
            ? "block py-1.5 text-right text-sm tabular-nums text-[#98a2b3]"
            : "block py-1.5 text-right text-sm font-semibold tabular-nums text-[#145c32]"
        }
      >
        {value === null ? "—" : eurosToCentsLabel(value)}
      </span>
    );
  }

  return (
    <input
      name={name}
      inputMode="decimal"
      value={year[rowKey]}
      onChange={(event) => onChange(event.target.value)}
      className={`${statementInputClassName} text-right`}
    />
  );
}
