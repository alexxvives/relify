"use client";

import { MarketCard } from "@/components/market-card";
import type { PublicProjectCard } from "@/lib/public-project";
import { sectorKeyFromCnae } from "@/lib/sector-image";
import { useModal } from "@/components/use-modal";
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { mergeStatementTable } from "@/lib/statement-merge";
import type { SellerFichaExtras } from "@/server/sellerFichaExtras";
import { rememberSessionFlag, usePanelOpen } from "@/components/session-flag";
import { useRouter } from "next/navigation";
import { Plus, Building2, CalendarDays, Check, ChevronDown, ChevronUp, CircleCheck, Clock, FileSpreadsheet, Handshake, Heart, Info, Lock, LockOpen, MapPin, Paperclip, Pencil, RefreshCw, Sparkles, Users, X } from "lucide-react";
import { sellerCopy } from "@/lib/seller-copy";
import { generateCodenameAction, saveCompanyDraftAction, saveEbitdaAdjustmentsAction, storeAdjustmentDocumentAction, type CompanyDraftState } from "@/app/(app)/mi-empresa/actions";
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
import { cnaeClasses, cnaeTitle as cnaeTitleOf } from "@/lib/cnae-2009";
import { ebitdaTrend, estimatePriceRange, formatMultiple, priceBarEnds, priceBarPosition, priceBarZone, priceStanding, weightedEbitdaCents, type PriceEstimate, type YearAmount } from "@/lib/valuation-multiples";
import { formatEur, formatWholeEur } from "@/lib/money";
import { headcountRanges as valuationHeadcounts, type HeadcountRangeId } from "@/lib/company-profile";
import { projectImageSrc } from "@/lib/project-image";
import { CardPhotoUploader, type GalleryPhoto } from "@/components/project-gallery";
import { balanceLabels, companyCopy, incomeLabels } from "@/lib/company-copy";
import { accessCopy } from "@/lib/access-copy";
import { marketCopy } from "@/lib/market-copy";
import { keepDigits, keepPercent, keepSignedEuro, keepUnsignedEuro, keepYear } from "@/lib/numeric-input";
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
  askingPriceIncludesKinds,
  descriptionMaxLength,
  descriptionMinLength,
  ownerDependenceLevels,
  premisesKinds,
  storedAskingPriceIncludes,
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
import { DetailSectionNav, type DetailSectionItem } from "@/components/detail-section-nav";
import { saveBlockReason } from "@/lib/seller-save";
import {
  adjustmentRowErrors,
  adjustmentRowsValid,
  defaultAdjustmentDirection,
  ebitdaAdjustmentDirectionLabels,
  ebitdaAdjustmentDirections,
  joinAdjustmentAmount,
  splitAdjustmentAmount,
  ebitdaAdjustmentLabels,
  adjustmentDocumentByteLimit,
  adjustmentDocumentExtension,
  ebitdaAdjustmentReasonMax,
  formRowAmountCents,
  formRowsFromJson,
  maxEbitdaAdjustments,
  selectableEbitdaAdjustmentTypes,
  type EbitdaAdjustmentFormRow,
  type EbitdaAdjustmentType,
} from "@/lib/ebitda-adjustments";
import { sellerStayLabels, sellerStayOptions } from "@/lib/seller-stay";
import {
  sellerFinancingChip,
  storedSellerFinancing,
  sellerFinancingLabels,
  sellerFinancingModes,
  sellerFinancingYearLabels,
  sellerFinancingYearOptions,
} from "@/lib/seller-financing";
import { askingPriceAllowed, priceBasisCents } from "@/lib/seller-draft-guard";
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

type AutoSaveState = "saving" | "saved" | "error" | null;

/** Lock on Datos de la ficha: text when the tile is wide (no tooltip); icon + tooltip + aria-label when it is not. */
function AccountsChip() {
  return (
    <span className="inline-flex max-w-full items-center">
      <span className="hidden min-w-0 items-center gap-1 text-xs font-medium whitespace-nowrap text-[#667085] @[12.5rem]:inline-flex">
        <Lock className="size-3 shrink-0" aria-hidden />
        De tus cuentas
      </span>
      <InfoHint text="De tus cuentas" width="auto" size="sm" hoverOnly>
        <span
          tabIndex={0}
          aria-label="De tus cuentas"
          className="inline-flex size-7 items-center justify-center rounded-full text-[#667085] @[12.5rem]:hidden"
        >
          <Lock className="size-3" aria-hidden />
        </span>
      </InfoHint>
    </span>
  );
}

/** Icon stays; label text only when the nearest @container is wide enough to keep it on one line. */
function CompactStatus({
  label,
  icon,
  className,
  reveal = "@[18rem]:inline",
}: {
  label: string;
  icon: ReactNode;
  className: string;
  reveal?: string;
}) {
  return (
    <InfoHint text={label} width="auto" size="sm">
      <span className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${className}`}>
        {icon}
        <span className={`hidden min-w-0 truncate whitespace-nowrap ${reveal}`}>{label}</span>
      </span>
    </InfoHint>
  );
}

/** t95: inline autosave status: Guardando… / Guardado / Error al guardar · Reintentar. */
function AutoSaveStatus({ state, onRetry }: { state: Exclude<AutoSaveState, null>; onRetry?: () => void }) {
  if (state === "error") {
    return (
      <span role="alert" className="inline-flex items-center gap-1 rounded-full bg-[#fdecea] px-2.5 py-1 text-xs font-medium text-[#a12f2f]">
        {companyCopy.autosaveError}
        {onRetry ? (
          <>
            <span aria-hidden>·</span>
            <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2 hover:text-[#7a1f1f] focus-visible:outline-2 focus-visible:outline-[#a12f2f]">
              {companyCopy.autosaveRetry}
            </button>
          </>
        ) : null}
      </span>
    );
  }
  return (
    <span role="status" className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${state === "saved" ? "bg-[#e8f6ee] text-[#17663a]" : "bg-[#eef1f5] text-[#475467]"}`}>
      {state === "saved" ? <CircleCheck className="size-3.5" aria-hidden /> : <Clock className="size-3.5 motion-safe:animate-pulse" aria-hidden />}
      {state === "saved" ? companyCopy.autosaveSaved : companyCopy.autosaveSaving}
    </span>
  );
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
  saveState = null,
  onRetry,
  onEdit,
  onCollapse,
  fixed = false,
  chip = true,
  children,
}: {
  /** t84: always expanded, no collapse/edit toggle (Ficha pública). */
  fixed?: boolean;
  chip?: boolean;
  id?: string;
  /** t76: guided numbering on the seller's "Información empresa" tab. */
  step?: number;
  title: string;
  intro?: string;
  hint?: string;
  open: boolean;
  done: boolean;
  dirty: boolean;
  /** t95: autosave status shown next to the title instead of the old save bar. */
  saveState?: AutoSaveState;
  onRetry?: () => void;
  onEdit: () => void;
  onCollapse: () => void;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-32 lg:scroll-mt-6">
      <div className="@container flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
            {step ? <StepNumber value={step} /> : null}
            {title}
            {hint ? <FieldHint text={hint} /> : null}
          </h2>
          {open ? null : intro ? <SectionIntro>{intro}</SectionIntro> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {saveState || dirty ? (
            <AutoSaveStatus state={saveState ?? "saving"} onRetry={onRetry} />
          ) : !chip ? null : (
            <CompactStatus
              label={done ? companyCopy.doneChip : companyCopy.pendingChip}
              className={done ? "bg-[#e8f6ee] text-[#17663a]" : "bg-[#fff4d6] text-[#8a6112]"}
              icon={done ? <CircleCheck className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
              reveal="@[28rem]:inline"
            />
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
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return value;
  }
  const cents = optionalEurosToCents(trimmed);
  if (cents === null) {
    return value;
  }
  return formatWholeEur(cents).replace(/ €$/, "");
}

function FigureField({
  label,
  name,
  value,
  onChange,
  locked = false,
  corner = null,
  unsetText,
  disabledReason = null,
  footer = null,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (next: string) => void;
  locked?: boolean;
  corner?: ReactNode;
  /** t83: shown instead of "0 €" while the figure is empty or 0 (e.g. "Sin definir" for the price). */
  unsetText?: string;
  /** t95: when set the figure is read-only and shows this text (e.g. "No publicable") instead of any stored value. */
  disabledReason?: string | null;
  footer?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const unset = unsetText !== undefined && !editing && !askingPriceSet(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = editing ? value : groupedEuro(value);
  const amount = shown.length > 0 ? shown : "—";
  const editable = !locked && onChange !== undefined && !disabledReason;

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
      <div className="flex min-w-0 flex-col items-start gap-2">
        <div className="min-w-0">
          {disabledReason ? (
            <span className="text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight text-[#98a2b3]">{disabledReason}</span>
          ) : editable && unset ? (
            <span className="text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight text-[#98a2b3]">{unsetText}</span>
          ) : editable ? (
            <span className="inline-flex max-w-full items-baseline gap-1 whitespace-nowrap">
              <input
                ref={inputRef}
                data-flash
                inputMode="decimal"
                aria-label={label}
                value={shown}
                placeholder="0"
                className="field-sizing-content max-w-full min-w-[3ch] rounded-md border border-transparent bg-transparent px-0 text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight text-[#1c2740] tabular-nums outline-none hover:border-[#d5dbe3] focus:border-[#465ab4] focus:bg-white focus:px-1.5"
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
              <span className="text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold text-[#1c2740]">€</span>
            </span>
          ) : (
            <span className="whitespace-nowrap text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight text-[#1c2740] tabular-nums">
              {amount === "—" ? amount : `${amount}\u00a0€`}
            </span>
          )}
        </div>
        {footer ? <div className="max-w-full min-w-0">{footer}</div> : null}
      </div>
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
    <div className="@container relative flex h-full min-h-[6.5rem] min-w-0 flex-col gap-2 overflow-visible rounded-2xl border border-[#e7eaee] bg-[#fbfbfc] p-4">
      <div className="flex min-h-7 min-w-0 items-center justify-between gap-x-2">
        <div className="flex min-w-0 items-center gap-1">
          <span className="text-sm font-semibold whitespace-nowrap text-[#667085]">{label}</span>
          {action}
        </div>
        {corner ? <div className="min-w-0 shrink">{corner}</div> : null}
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
  netResult,
  priceStatus = null,
  priceBlocked = false,
  adjustmentCount,
  pendingCount = 0,
  adjustments,
  recommended = null,
  askingPriceIncludes,
  onAskingPriceIncludes,
}: {
  revenue: string;
  askingPrice: string;
  onAskingPrice: (value: string) => void;
  ebitda: string;
  adjustedEbitda: string;
  margin: string;
  netResult: string;
  priceStatus?: ReactNode;
  priceBlocked?: boolean;
  adjustmentCount: number;
  pendingCount?: number;
  adjustments: (close: () => void) => ReactNode;
  /** Midpoint of the orientative range; fills the asking price. Hidden while the company cannot be published. */
  recommended?: { amount: string; onUse: () => void; applied?: boolean } | null;
  askingPriceIncludes: (typeof askingPriceIncludesKinds)[number];
  onAskingPriceIncludes: (value: (typeof askingPriceIncludesKinds)[number]) => void;
}) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const adjustedCents = adjustmentCount > 0 && signedEuroPattern.test(adjustedEbitda.trim()) ? eurosToCents(adjustedEbitda.trim()) : null;
  return (
    <div className="@container mt-6">
    <div className="grid grid-cols-1 items-stretch gap-3 @min-[22rem]:grid-cols-2 @min-[48rem]:grid-cols-3">
      <div id="panel-asking-price" className="h-full min-w-0 scroll-mt-24">
        <FigureField
          label={companyCopy.askingPriceLabel}
          name="askingPrice"
          value={askingPrice}
          onChange={onAskingPrice}
          corner={priceStatus}
          unsetText={companyCopy.priceUnset}
          disabledReason={priceBlocked ? companyCopy.priceNotPublishable : null}
          footer={
            recommended && !priceBlocked && !recommended.applied ? (
              <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085]">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Sparkles className="size-3.5 shrink-0 text-[#465ab4]" aria-hidden />
                  <span>
                    {companyCopy.suggestedPrice}:{" "}
                    <span className="font-semibold whitespace-nowrap text-[#1c2740] tabular-nums">{recommended.amount}</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={recommended.onUse}
                  aria-label={companyCopy.applySuggestedAria.replace("{amount}", recommended.amount)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-[#465ab4] hover:bg-[#eef1fb] focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 focus-visible:outline-none"
                >
                  <Check className="size-3.5" aria-hidden />
                  {companyCopy.applySuggested}
                </button>
              </p>
            ) : null
          }
        />
      </div>
      <div className="h-full min-w-0">
      <MetricTile label={companyCopy.ebitdaMarginLabel}>
        <span className="whitespace-nowrap text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight text-[#1c2740] tabular-nums">{margin}</span>
      </MetricTile>
      </div>
      {/* t85: the adjustments editor lives in a modal behind the pencil; the tile shows the result or "Sin ajustes". */}
      <div id="ebitda-ajustado" className="h-full min-w-0 scroll-mt-24">
        <MetricTile
          label={companyCopy.adjustedEbitdaLabel}
          action={
            <button
              type="button"
              aria-label="Editar ajustes al EBITDA"
              aria-haspopup="dialog"
              onClick={() => setAdjustOpen(true)}
              className="inline-flex size-7 items-center justify-center rounded-full text-[#465ab4] hover:bg-[#eef1fb] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
          }
          corner={
            pendingCount > 0 ? (
              <CompactStatus
                label={`${pendingCount} ${companyCopy.adjustmentPending}`}
                className="bg-[#fff4e5] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#7a4700] uppercase"
                icon={<Clock className="size-3" aria-hidden />}
              />
            ) : adjustmentCount > 0 ? (
              <CompactStatus
                label={`${adjustmentCount} ${adjustmentCount === 1 ? "ajuste" : "ajustes"}`}
                className="bg-transparent px-0 text-[#667085]"
                icon={<CircleCheck className="size-3 text-[#0f766e]" aria-hidden />}
              />
            ) : null
          }
        >
          {adjustedCents !== null ? (
            <span className={`flex items-center gap-1.5 text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight tabular-nums ${adjustedCents < 0 ? "whitespace-nowrap text-[#b42318]" : "whitespace-nowrap text-[#1c2740]"}`}>
              {wholeEur(adjustedCents).replace(" €", "\u00a0€")}
            </span>
          ) : (
            <button type="button" onClick={() => setAdjustOpen(true)} className="text-left">
              <span className="whitespace-nowrap text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight text-[#1c2740] tabular-nums">—</span>
            </button>
          )}
        </MetricTile>
      </div>
      <ReadOnlyFigure label={companyCopy.revenueLabel} value={revenue} />
      <ReadOnlyFigure label={companyCopy.ebitdaLabel} value={ebitda} />
      {/* t85: 6th tile completes the 3×2 grid; net result of the same closed year, from the stored accounts. */}
      <ReadOnlyFigure label="Resultado neto" value={netResult} />
      {adjustOpen ? adjustments(() => setAdjustOpen(false)) : null}
    </div>
    <div className="mt-4 rounded-2xl border border-[#e7eaee] bg-[#fbfbfc] p-4">
      <p id="asking-price-includes-label" className="flex items-center gap-1.5 text-sm font-semibold text-[#1c2740]">
        {companyCopy.askingPriceIncludesLabel}
        <FieldHint text={companyCopy.askingPriceIncludesHint} />
      </p>
      <input type="hidden" name="askingPriceIncludes" value={askingPriceIncludes} />
      <div
        role="radiogroup"
        aria-labelledby="asking-price-includes-label"
        className="mt-3 grid grid-cols-2 gap-2"
      >
        {askingPriceIncludesKinds.map((option) => {
          const selected = askingPriceIncludes === option;
          const title = option === "shares" ? companyCopy.askingPriceIncludesShares : companyCopy.askingPriceIncludesDebtFree;
          const help = option === "shares" ? companyCopy.askingPriceIncludesSharesHelp : companyCopy.askingPriceIncludesDebtFreeHelp;
          return (
          <button
            key={option}
            type="button"
            role="radio"
            title={help}
            aria-checked={selected}
            onClick={() => onAskingPriceIncludes(option)}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-center text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
              selected
                ? "border-[#1c2740] bg-[#1c2740] text-white"
                : "border-[#e7eaee] bg-white text-[#3d4a63] hover:bg-[#f2f4f7]"
            }`}
          >
            {title}
          </button>
          );
        })}
      </div>
    </div>
    </div>
  );
}

/**
 * t90: seller financing (pago aplazado). One question plus two optional terms; the hidden inputs post with the page
 * form like the other Datos de la ficha fields. Format errors show once a field is filled; "Sí" with a missing term
 * only shows after a save attempt flagged it.
 */
// t92: shared text-input style for the ficha fields and the adjustments dialog.
const fieldInputClass =
  "h-10 w-full min-w-0 rounded-xl border border-[#d8dee8] bg-white px-3 text-sm text-[#1c2740] placeholder:text-[#98a2b3] focus-visible:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#7fd6cc] focus-visible:outline-none aria-invalid:border-[#c0362c] aria-invalid:bg-[#fff6f6]";

function SellerFinancingField({
  mode,
  pct,
  years,
  onMode,
  onPct,
  onYears,
}: {
  mode: string;
  pct: string;
  years: string;
  onMode: (value: string) => void;
  onPct: (value: string) => void;
  onYears: (value: string) => void;
}) {
  const terms = mode === "yes" || mode === "negotiable";
  return (
    <div id="panel-seller-financing" className="flex h-full scroll-mt-24 flex-col rounded-2xl border border-[#e7eaee] bg-[#fbfbfc] p-4">
      <input type="hidden" name="sellerFinancing" value={mode} />
      <input type="hidden" name="sellerFinancingPct" value={terms ? pct : ""} />
      <input type="hidden" name="sellerFinancingYears" value={terms ? years : ""} />
      <p id="seller-financing-label" className="text-sm font-semibold text-[#1c2740]">
        ¿Aceptarías financiar parte del precio?
      </p>
      <p id="seller-financing-help" className="mt-1 mb-3 text-xs leading-5 text-[#667085]">
        El comprador te pagaría una parte más adelante, a plazos.
      </p>
      <div className="flex min-w-0 items-center gap-1.5">
        <div
          role="radiogroup"
          data-flash
          aria-labelledby="seller-financing-label"
          aria-describedby="seller-financing-help"
          className={`grid h-10 min-w-0 grid-cols-3 rounded-xl border border-[#e7eaee] bg-white p-0.5 ${terms ? "flex-[1.35]" : "w-full"}`}
        >
          {sellerFinancingModes.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-label={sellerFinancingLabels[option]}
              aria-checked={mode === option}
              onClick={() => onMode(option)}
              className={`rounded-lg px-1 text-[11px] font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none sm:px-3 sm:text-sm ${
                mode === option ? "bg-[#1c2740] text-white" : "text-[#475467] hover:bg-[#f2f4f7]"
              }`}
            >
              <span className="sm:hidden">{option === "negotiable" ? "Neg." : sellerFinancingLabels[option]}</span>
              <span className="hidden sm:inline">{sellerFinancingLabels[option]}</span>
            </button>
          ))}
        </div>
        {terms ? (
          <>
            <label className="flex h-10 min-w-[4.25rem] flex-1 items-center gap-1 rounded-xl border border-[#d8dee8] bg-white px-2">
              <span className="shrink-0 text-xs font-medium text-[#667085]">%</span>
              <input
                data-flash
                inputMode="numeric"
                aria-label="Porcentaje del precio financiado"
                value={pct}
                onChange={(event) => onPct(keepDigits(event.target.value, 3))}
                className="h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[#1c2740] placeholder:text-[#98a2b3] focus-visible:outline-none"
                placeholder="20"
              />
            </label>
            <div className="min-w-[5.25rem] flex-1">
              <OptionSelect
                label="Plazo de la financiación"
                placeholder="Plazo"
                textSize="sm"
                value={years}
                options={sellerFinancingYearOptions.map((option) => ({ value: String(option), label: sellerFinancingYearLabels[option] }))}
                onValueChange={onYears}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** t94: ¿Te quedarías como asesor tras la venta? Optional; a dropdown in a card that sits next to the financing one. */
function SellerStayField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div id="panel-seller-stay" className="flex h-full scroll-mt-24 flex-col rounded-2xl border border-[#e7eaee] bg-[#fbfbfc] p-4">
      <p id="seller-stay-label" className="text-sm font-semibold text-[#1c2740]">
        ¿Te quedarías como asesor tras la venta?
      </p>
      <p id="seller-stay-help" className="mt-1 text-xs leading-5 text-[#667085]">
        Ayudar al comprador durante el traspaso da confianza.
      </p>
      <div className="mt-auto pt-3">
        <OptionSelect
          id="seller-stay-select"
          name="sellerStay"
          label="¿Te quedarías como asesor tras la venta?"
          placeholder="Elige una opción"
          describedBy="seller-stay-help"
          textSize="sm"
          value={value}
          options={sellerStayOptions.map((option) => ({ value: option, label: sellerStayLabels[option] }))}
          onValueChange={onChange}
        />
      </div>
    </div>
  );
}

/**
 * t89: the adjustments editor is a self-contained dialog. It edits a copy of the saved rows, validates each field
 * inline and saves through its own server action; closing or cancelling discards the copy, so the page never
 * holds half-edited adjustments (and never shows a page-level adjustments error).
 */
// t92: one label style for every field in the adjustments dialog.
const adjustmentLabelClass = "block text-xs font-medium text-[#475467]";

function EbitdaAdjustmentsDialog({
  rows: savedRows,
  onSaved,
  onClose,
  baseCents,
  year,
  legacyCents,
  uploadsDisabled = false,
}: {
  rows: EbitdaAdjustmentFormRow[];
  onSaved: (rows: EbitdaAdjustmentFormRow[], json: string) => void;
  onClose: () => void;
  baseCents: number | null;
  year: string | null;
  legacyCents: number | null;
  uploadsDisabled?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<EbitdaAdjustmentFormRow[]>(savedRows);
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [pending, startSave] = useTransition();
  useModal(panel, onClose);
  const update = (index: number, patch: Partial<EbitdaAdjustmentFormRow>) => {
    setServerError(null);
    setRows((current) => current.map((row, position) => (position === index ? { ...row, ...patch, status: patch.status ?? "pending" } : row)));
  };
  async function attach(index: number, file: File) {
    setServerError(null);
    if (file.size === 0 || !adjustmentDocumentExtension(file.name)) {
      setServerError(companyCopy.adjustmentDocumentType);
      return;
    }
    if (file.size > adjustmentDocumentByteLimit) {
      setServerError(companyCopy.adjustmentDocumentTooBig);
      return;
    }
    setUploading(index);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await storeAdjustmentDocumentAction(data);
      if (!result.ok) {
        setServerError(result.message);
        return;
      }
      update(index, { documentId: result.documentId, documentName: result.documentName, status: "pending" });
    } catch {
      setServerError(uploadsDisabled ? companyCopy.adjustmentDocumentIntDisabled : companyCopy.adjustmentDocumentSaveFailed);
    } finally {
      setUploading(null);
    }
  }
  const errors = rows.map((row) => (attempted ? adjustmentRowErrors(row) : {}));
  const sum = rows.reduce<number>((total, row) => total + (formRowAmountCents(row.amount) ?? 0), 0);
  const unchanged = adjustmentRowsJson(rows) === adjustmentRowsJson(savedRows);
  function save() {
    setAttempted(true);
    setServerError(null);
    if (!adjustmentRowsValid(rows)) {
      const first = rows.findIndex((row) => Object.keys(adjustmentRowErrors(row)).length > 0);
      panel.current?.querySelector<HTMLElement>(`[data-adjustment-row="${first}"] [aria-invalid="true"]`)?.focus();
      return;
    }
    if (unchanged) {
      onClose();
      return;
    }
    startSave(async () => {
      const result = await saveEbitdaAdjustmentsAction(adjustmentRowsJson(rows));
      if (!result.ok) {
        setServerError(result.message);
        return;
      }
      const stored = formRowsFromJson(result.json);
      onSaved(stored, adjustmentRowsJson(stored));
      setSaved(true);
      window.setTimeout(onClose, 700);
    });
  }
  const inputClass = fieldInputClass;
  const signed = (cents: number) => `${cents > 0 ? "+" : ""}${formatEur(cents)}`;
  const adjustedTotal = baseCents === null ? null : baseCents + sum;
  const adjustedTone =
    adjustedTotal === null || adjustedTotal === 0
      ? { cell: "bg-[#fafbfd]", ink: "text-[#667085]" }
      : adjustedTotal < 0
        ? { cell: "bg-[#fdecec]", ink: "text-[#b42318]" }
        : { cell: "bg-[#e7f6ee]", ink: "text-[#17663a]" };
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0b1220]/55 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ebitda-adjustments-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl focus:outline-none sm:w-[min(64rem,100%)] sm:rounded-2xl"
      >
        <header className="shrink-0 border-b border-[#eef0f4] px-4 pt-4 pb-4 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="ebitda-adjustments-title" className="text-base font-semibold text-[#1c2740]">
                {companyCopy.adjustmentsTitle}
              </h3>
              {year ? <p className="mt-0.5 text-sm text-[#667085]">{companyCopy.adjustmentsYear.replace("{year}", year)}</p> : null}
              <p className="mt-1 text-sm text-[#667085]">{companyCopy.adjustmentPendingNote}</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar sin guardar"
              onClick={onClose}
              className="-mt-1 -mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] hover:text-[#1c2740] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-[#e7eaee] text-center tabular-nums" aria-live="polite">
            <div className="px-2 py-2.5">
              <dt className="text-[11px] font-medium tracking-wide text-[#667085] uppercase sm:text-xs">EBITDA cuentas</dt>
              <dd className="mt-0.5 text-sm font-semibold text-[#1c2740] sm:text-base">{baseCents === null ? "—" : formatEur(baseCents)}</dd>
            </div>
            <div className="border-x border-[#e7eaee] px-2 py-2.5">
              <dt className="text-[11px] font-medium tracking-wide text-[#667085] uppercase sm:text-xs">{companyCopy.adjustmentsTotal}</dt>
              <dd className={`mt-0.5 text-sm font-semibold sm:text-base ${sum < 0 ? "text-[#b42318]" : "text-[#1c2740]"}`}>{signed(sum)}</dd>
            </div>
            <div className={`${adjustedTone.cell} px-2 py-2.5`}>
              <dt className={`text-[11px] font-medium tracking-wide uppercase sm:text-xs ${adjustedTone.ink}`}>EBITDA ajustado</dt>
              <dd className={`mt-0.5 text-sm font-semibold sm:text-base ${adjustedTone.ink}`}>{adjustedTotal === null ? "—" : formatEur(adjustedTotal)}</dd>
            </div>
          </dl>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {rows.length === 0 ? (
            legacyCents !== null ? (
              <p className="text-sm text-[#667085]">
                <span className="font-semibold text-[#1c2740]">{companyCopy.adjustmentsLegacy}: {formatEur(legacyCents)}.</span> {companyCopy.adjustmentsLegacyNote}
              </p>
            ) : (
              <p className="text-sm text-[#667085]">{companyCopy.adjustmentsEmpty}</p>
            )
          ) : (
            <ol className="flex flex-col gap-3">
              {rows.map((row, index) => {
                const rowErrors = errors[index] ?? {};
                const id = `adjustment-${index}`;
                return (
                  <li key={index} data-adjustment-row={index} className="rounded-xl border border-[#e7eaee] bg-[#fbfcfd] p-3">
                    <div className="flex items-start gap-2">
                      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_8.5rem]">
                        <div className="min-w-0">
                          <label htmlFor={`${id}-type`} className={adjustmentLabelClass}>
                            {companyCopy.adjustmentTypeLabel}
                          </label>
                          <div className="mt-1">
                            <OptionSelect
                              id={`${id}-type`}
                              label={companyCopy.adjustmentTypeLabel}
                              placeholder="Elige un tipo"
                              textSize="sm"
                              value={row.type}
                              invalid={Boolean(rowErrors.type)}
                              describedBy={rowErrors.type ? `${id}-type-error` : undefined}
                              options={selectableEbitdaAdjustmentTypes.map((type) => ({ value: type, label: ebitdaAdjustmentLabels[type] }))}
                              onValueChange={(value) => {
                                const type = value as EbitdaAdjustmentType;
                                const parts = splitAdjustmentAmount(row.amount, row.type);
                                // t91: an untouched row follows the new type's usual direction; a typed amount keeps the seller's choice.
                                update(index, parts.amount === "" ? { type, amount: joinAdjustmentAmount("", defaultAdjustmentDirection(type)) } : { type });
                              }}
                            />
                          </div>
                          {rowErrors.type ? (
                            <p id={`${id}-type-error`} className="mt-1 text-xs text-[#b42318]">
                              {rowErrors.type}
                            </p>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <span id={`${id}-direction-label`} className={adjustmentLabelClass}>
                            Coste / Ingreso
                          </span>
                          <div role="radiogroup" aria-labelledby={`${id}-direction-label`} className="mt-1 flex h-11 rounded-xl border border-[#e7eaee] bg-white p-1">
                            {ebitdaAdjustmentDirections.map((direction) => {
                              const parts = splitAdjustmentAmount(row.amount, row.type);
                              const active = parts.direction === direction;
                              return (
                                <button
                                  key={direction}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  onClick={() => update(index, { amount: joinAdjustmentAmount(parts.amount, direction) })}
                                  className={`flex-1 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
                                    active ? "bg-[#1c2740] text-white" : "text-[#475467] hover:bg-[#f2f4f7]"
                                  }`}
                                >
                                  {ebitdaAdjustmentDirectionLabels[direction]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <label htmlFor={`${id}-amount`} className={adjustmentLabelClass}>
                            {companyCopy.adjustmentAmountLabel}
                          </label>
                          <div className="relative mt-1">
                            <span aria-hidden className={`pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold ${splitAdjustmentAmount(row.amount, row.type).direction === "income" ? "text-[#b42318]" : "text-[#0f766e]"}`}>
                              {splitAdjustmentAmount(row.amount, row.type).direction === "income" ? "−" : "+"}
                            </span>
                            <input
                              id={`${id}-amount`}
                              inputMode="decimal"
                              value={splitAdjustmentAmount(row.amount, row.type).amount}
                              placeholder="0"
                              aria-invalid={rowErrors.amount ? true : undefined}
                              aria-describedby={rowErrors.amount ? `${id}-amount-error` : undefined}
                              onChange={(event) =>
                                update(index, { amount: joinAdjustmentAmount(keepUnsignedEuro(event.target.value), splitAdjustmentAmount(row.amount, row.type).direction) })
                              }
                              className={`${inputClass} h-11 pl-7 text-right tabular-nums`}
                            />
                          </div>
                          {rowErrors.amount ? (
                            <p id={`${id}-amount-error`} className="mt-1 text-xs text-[#b42318]">
                              {rowErrors.amount}
                            </p>
                          ) : null}
                        </div>
                        <div className="min-w-0 sm:col-span-3">
                          <label htmlFor={`${id}-reason`} className={`flex flex-wrap items-center justify-between gap-2 ${adjustmentLabelClass}`}>
                            <span className="inline-flex items-center gap-2">
                              Justificación
                              <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold tracking-wide uppercase ${row.status === "approved" ? "bg-[#e8f6ee] text-[#17663a]" : "bg-[#fff4e5] text-[#7a4700]"}`}>
                                {row.status === "approved" ? companyCopy.adjustmentApproved : companyCopy.adjustmentPending}
                              </span>
                            </span>
                            <span className="font-normal text-[#98a2b3] tabular-nums">
                              {row.reason.length}/{ebitdaAdjustmentReasonMax}
                            </span>
                          </label>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <input
                              id={`${id}-reason`}
                              value={row.reason}
                              maxLength={ebitdaAdjustmentReasonMax}
                              placeholder={companyCopy.adjustmentReasonPlaceholder}
                              aria-invalid={rowErrors.reason ? true : undefined}
                              aria-describedby={rowErrors.reason ? `${id}-reason-error` : undefined}
                              onChange={(event) => update(index, { reason: event.target.value })}
                              className={`${inputClass} min-w-0 flex-1 basis-48`}
                            />
                            <label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#1c2740] hover:bg-[#f4f7ff]">
                              <Paperclip className="size-4 text-[#465ab4]" aria-hidden />
                              {uploading === index ? companyCopy.adjustmentAttachBusy : companyCopy.adjustmentAttach}
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv"
                                className="sr-only"
                                disabled={uploading !== null}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  event.target.value = "";
                                  if (file) {
                                    void attach(index, file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {row.documentName ? (
                            <p className="mt-1 flex items-center gap-2 text-xs text-[#3d4a63]">
                              {row.documentId ? (
                                <a href={`/mi-empresa/ajustes/${row.documentId}`} target="_blank" rel="noreferrer" className="truncate font-medium text-[#3d34b8] hover:underline">
                                  {row.documentName}
                                </a>
                              ) : (
                                <span className="truncate">{row.documentName}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => update(index, { documentId: "", documentName: "", status: "pending" })}
                                className="shrink-0 font-medium text-[#b42318] hover:underline"
                              >
                                {companyCopy.adjustmentRemoveFile}
                              </button>
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-[#98a2b3]">{companyCopy.adjustmentDocumentHint}</p>
                          )}
                          {rowErrors.reason ? (
                            <p id={`${id}-reason-error`} className="mt-1 text-xs text-[#b42318]">
                              {rowErrors.reason}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={companyCopy.adjustmentsRemove}
                        title={companyCopy.adjustmentsRemove}
                        onClick={() => {
                          setServerError(null);
                          setRows((current) => current.filter((_, position) => position !== index));
                        }}
                        className="mt-5 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] hover:text-[#b42318] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <button
            type="button"
            disabled={rows.length >= maxEbitdaAdjustments}
            onClick={() => {
              setServerError(null);
              setRows((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  type: "owner_salary",
                  amount: joinAdjustmentAmount("", defaultAdjustmentDirection("owner_salary")),
                  reason: "",
                  status: "pending",
                  documentId: "",
                  documentName: "",
                },
              ]);
            }}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#c5ccd8] text-sm font-medium text-[#0f766e] hover:border-[#0f766e] hover:bg-[#f0faf8] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden />
            {companyCopy.adjustmentsAdd}
          </button>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#eef0f4] px-4 py-3 sm:px-6">
          <p role="status" className="mr-auto min-w-0 text-sm">
            {serverError ? (
              <span className="text-[#b42318]">{serverError}</span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#0f766e]">
                <CircleCheck className="size-4" aria-hidden />
                Guardado
              </span>
            ) : attempted && !adjustmentRowsValid(rows) ? (
              <span className="text-[#b42318]">Revisa los campos marcados.</span>
            ) : null}
          </p>
          <KitButton type="button" tone="outline" size="sm" onClick={onClose} disabled={pending}>
            Cancelar
          </KitButton>
          <KitButton type="button" tone="navy" size="sm" onClick={save} disabled={pending || saved}>
            {pending ? "Guardando…" : "Guardar"}
          </KitButton>
        </footer>
      </div>
    </div>
  );
}

function ReadOnlyFigure({ label, value }: { label: string; value: string }) {
  const cents = signedEuroPattern.test(value.trim()) ? eurosToCents(value.trim()) : null;
  return (
    <div className="h-full min-w-0">
    <MetricTile
      label={label}
      corner={<AccountsChip />}
    >
      <span className="flex items-center gap-1.5 text-[clamp(1.5rem,1.2rem+1.6vw,2.125rem)] font-semibold tracking-tight text-[#1c2740] tabular-nums">
        {cents !== null && cents !== 0 ? (
          <span className={cents < 0 ? "whitespace-nowrap text-[#b42318]" : "whitespace-nowrap"}>
            {wholeEur(cents).replace(" €", "\u00a0€")}
          </span>
        ) : (
          <span className="text-base font-medium text-[#667085]">Pendiente de cargar</span>
        )}
      </span>
    </MetricTile>
    </div>
  );
}

function adjustmentRowsJson(rows: EbitdaAdjustmentFormRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: row.amount.trim().replace(/[.\s]/g, ""),
      reason: row.reason.trim(),
      documentId: row.documentId,
      documentName: row.documentName,
    })),
  );
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

/** t94: EBITDA per closed year, fed to the 3-year least-squares trendline. */
function ebitdaByYear(years: ClosedYearInput[]): YearAmount[] {
  return years
    .map((year) => ({ year: Number(year.year), cents: incomeValue("ebitda", previewPnl(year)) }))
    .filter((row): row is YearAmount => Number.isInteger(row.year) && typeof row.cents === "number" && Number.isFinite(row.cents));
}

function wholeEur(cents: number): string {
  return formatWholeEur(cents);
}

/** Midpoint of the orientative range, rounded to the nearest euro, as the asking-price field stores it. */
function recommendedPriceCents(estimate: PriceEstimate): number {
  return Math.round((estimate.lowCents + estimate.highCents) / 200) * 100;
}

function recommendedPriceInput(estimate: PriceEstimate): string {
  return String(recommendedPriceCents(estimate) / 100);
}

const standingCopy = {
  below: { text: "Por debajo del rango", short: "Bajo rango", className: "bg-[#eef1fb] text-[#465ab4]" },
  within: { text: "Dentro del rango", short: "En rango", className: "bg-[#e8f6ee] text-[#17663a]" },
  above: { text: "Por encima del rango", short: "Sobre rango", className: "bg-[#fff4e0] text-[#8a5300]" },
} as const;

/** Suggested price as a status pill under the price input; the range, the bar and the why live in a popover. */
// t93: the popover is position:fixed (the metric tile clips overflow), stays open while the pointer crosses the gap,
// and closes with Esc. It shows a red→orange→yellow→green→…→red bar with the asking price as a black dot.
function PriceStatus({
  estimate,
  askingCents,
  blocked = false,
  rangeNote,
}: {
  estimate: PriceEstimate | null;
  askingCents: number | null;
  blocked?: boolean;
  rangeNote?: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [place, setPlace] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = hovered || pinned;
  const standing = !blocked && estimate && askingCents !== null && askingCents > 0 ? standingCopy[priceStanding(askingCents, estimate)] : null;

  const enter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovered(true);
  };
  const leave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(false), 150);
  };

  useEffect(() => {
    if (!shown) return;
    const measure = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPlace({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPinned(false);
        setHovered(false);
      }
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      window.removeEventListener("keydown", onKey);
    };
  }, [shown]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={shown}
        aria-controls="price-guide"
        onClick={() => setPinned((value) => !value)}
        onBlur={() => setPinned(false)}
        aria-label={standing ? standing.text : blocked ? "Rango no disponible" : "Rango orientativo"}
        title={standing ? standing.text : blocked ? "Rango no disponible" : "Rango orientativo"}
        className={`inline-flex h-6 max-w-full items-center gap-1 rounded-full px-1.5 text-[11px] leading-none font-semibold ${standing ? standing.className : "bg-[#f2f4f7] text-[#475467]"}`}
      >
        <Info className="size-3 shrink-0" aria-hidden />
        <span className="hidden min-w-0 truncate whitespace-nowrap @[18rem]:inline">
          {standing ? standing.text : blocked ? "Rango no disponible" : "Rango orientativo"}
        </span>
        <span className="sr-only">{blocked ? "Por qué no hay rango" : "Ver rango de precio orientativo"}</span>
      </button>
      {shown && place ? (
        <div
          id="price-guide"
          role="tooltip"
          onMouseEnter={enter}
          onMouseLeave={leave}
          style={{ top: place.top, right: place.right }}
          className="fixed z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-[#e6e9f0] bg-white p-4 text-left shadow-[0_18px_40px_-20px_rgba(28,39,64,0.45)]"
        >
          {blocked ? (
            <>
              <p className="text-sm font-semibold text-[#1c2740]">Rango no disponible</p>
              <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{companyCopy.priceBlockedHint}</p>
            </>
          ) : estimate ? (
            <>
              <p className="text-sm font-semibold text-[#1c2740]">Rango orientativo de precio</p>
              <PriceBar estimate={estimate} askingCents={askingCents} />
              <p className="mt-3 text-xs leading-5 text-[#3d4a63]">
                Múltiplo EBITDA:{" "}
                <span className="tabular-nums font-semibold text-[#1c2740]">
                  {formatMultiple(estimate.multipleLow)} – {formatMultiple(estimate.multipleHigh)}
                </span>
              </p>
              {rangeNote ? <p className="mt-2 text-xs leading-5 text-[#667085]">{rangeNote}</p> : null}
              <p className="mt-2 border-t border-[#eef0f4] pt-2 text-xs leading-5 text-[#667085]">
                Referencia orientativa por sector, no es una valoración. El precio lo decides tú.
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-[#3d4a63]">
              Para calcular el rango necesitamos un EBITDA positivo (de tus cuentas o ajustado). Con él te mostraremos un rango orientativo para tu sector.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

const priceBarGradient = `linear-gradient(to right, #d92d20 0%, #f79009 ${priceBarZone.low * 45}%, #fdb022 ${priceBarZone.low * 85}%, #12b76a ${priceBarZone.low * 100}%, #12b76a ${priceBarZone.high * 100}%, #fdb022 ${priceBarZone.high * 100 + (1 - priceBarZone.high) * 15}%, #f79009 ${priceBarZone.high * 100 + (1 - priceBarZone.high) * 55}%, #d92d20 100%)`;

function PriceBar({ estimate, askingCents }: { estimate: PriceEstimate; askingCents: number | null }) {
  const { minCents, maxCents } = priceBarEnds(estimate);
  const dot = askingCents !== null && askingCents > 0 ? priceBarPosition(askingCents, estimate) : null;
  return (
    <div className="mt-3">
      {dot !== null ? (
        <p className="mb-1.5 flex items-center justify-end gap-1.5 text-[11px] leading-4 text-[#475467]">
          <span className="size-2 rounded-full bg-[#101828]" aria-hidden /> Tu precio: <span className="tabular-nums font-semibold text-[#1c2740]">{wholeEur(askingCents!)}</span>
        </p>
      ) : null}
      <div className="relative h-2.5 rounded-full" style={{ background: priceBarGradient }}>
        {dot !== null ? (
          <span
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#101828] shadow"
            style={{ left: `${dot * 100}%` }}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-start gap-2 text-[11px] leading-4 text-[#667085] tabular-nums">
        <span>
          Mín.
          <br />
          {wholeEur(minCents)}
        </span>
        <span className="text-center font-semibold text-[#17663a]">
          Rango
          <br />
          {wholeEur(estimate.lowCents)} – {wholeEur(estimate.highCents)}
        </span>
        <span className="text-right">
          Máx.
          <br />
          {wholeEur(maxCents)}
        </span>
      </div>
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
      <p className="flex h-9 items-center">{label}</p>
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
      <div data-flash className="flex flex-wrap justify-center gap-2">
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
        {/* t87: "Tu progreso" highlights this plus button (data-flash), not the section title. */}
        <span data-flash className="inline-flex rounded-full">
          <AddIconButton
            label={addLabel}
            disabled={values.length >= maxActivitySlices}
            onClick={() => {
              onChange([...values, ""]);
            }}
          />
        </span>
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
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="inline-flex size-6 items-center justify-center rounded-full border border-[#d8dee8] bg-white">
        <Plus className="size-3.5" aria-hidden />
      </span>
    </button>
  );
}

function Fact({
  id,
  icon: Icon,
  label,
  required = false,
  className = "",
  children,
}: {
  id?: string;
  icon: typeof Building2;
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className={`grid scroll-mt-32 grid-cols-[2.75rem_minmax(0,1fr)] items-end gap-3 lg:scroll-mt-6 ${className}`}>
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

/** t85: empty rows added with "+" don't count as a change until they get a value. */
function sameList(rawLeft: readonly string[], rawRight: readonly string[]): boolean {
  const left = rawLeft.filter((value) => value.trim().length > 0);
  const right = rawRight.filter((value) => value.trim().length > 0);
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
  initialTab = "company",
  coverSrc = null,
  financeExtra = null,
  reportYears = null,
  fichaExtras = null,
  uploadsDisabled = false,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  focus?: SellerFocusPanel | null;
  /** t91: read from ?tab= on the server. */
  initialTab?: "company" | "deal";
  coverSrc?: string | null;
  /** INT blocks file uploads; the EBITDA dialog shows a dedicated sentence. */
  uploadsDisabled?: boolean;
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
  const [leaveFailedHref, setLeaveFailedHref] = useState<string | null>(null);
  const initial = draft ?? emptyCompanyDraft();
  // t95: the save runs outside a React transition. Inside one, the router refresh that follows revalidatePath kept the
  // action "pending" after the response had landed when the save started from the debounce timer.
  const [state, setState] = useState<CompanyDraftState>(null);
  const [pending, setPending] = useState(false);
  const stateRef = useRef<CompanyDraftState>(null);
  async function action(data: FormData) {
    setPending(true);
    let next: CompanyDraftState;
    try {
      next = await saveCompanyDraftAction(stateRef.current, data);
    } catch {
      next = { message: companyCopy.autosaveError, saved: false };
    }
    const landed = next ?? { message: companyCopy.autosaveError, saved: false };
    stateRef.current = landed;
    setState(landed);
    setPending(false);
    const href = leaveHrefRef.current;
    if (href) {
      leaveHrefRef.current = null;
      if (landed.saved) {
        setLeaveFailedHref(null);
        router.push(href);
      } else {
        setLeaveFailedHref(href);
      }
    }
  }
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
  const [hadAdjustmentList, setHadAdjustmentList] = useState(() => initial.ebitdaAdjustments.trim() !== "");
  const [opex] = useState(initial.opex);
  const [askingPrice, setAskingPrice] = useState(initial.askingPrice);
  const [sellerFinancing, setSellerFinancing] = useState<string>(initial.sellerFinancing);
  const [sellerFinancingPct, setSellerFinancingPct] = useState(initial.sellerFinancingPct);
  const [sellerFinancingYears, setSellerFinancingYears] = useState(initial.sellerFinancingYears);
  const [sellerStay, setSellerStay] = useState<string>(initial.sellerStay);
  const [ownerDependence, setOwnerDependence] = useState(initial.ownerDependence);
  const [premisesKind, setPremisesKind] = useState(initial.premisesKind);
  const [rentMonthly, setRentMonthly] = useState(initial.rentMonthly);
  const [leaseYearsRemaining, setLeaseYearsRemaining] = useState(initial.leaseYearsRemaining);
  const [recurringRevenuePct, setRecurringRevenuePct] = useState(initial.recurringRevenuePct);
  const [askingPriceIncludes, setAskingPriceIncludes] = useState(() => storedAskingPriceIncludes(initial.askingPriceIncludes));
  const [capitalPercents] = useState(initial.capitalPercents);
  const [productPercents, setProductPercents] = useState(initial.productPercents);
  const [clientPercents, setClientPercents] = useState(initial.clientPercents);
  const startingCustomer: CompanyDraftInput["customerBase"] =
    initial.customerBase !== "" ? initial.customerBase : initial.clientPercents.length > 0 ? "business" : "";
  const [customerBase, setCustomerBase] = useState(startingCustomer);
  const [headcount, setHeadcount] = useState(initial.headcount);
  const [nif, setNif] = useState(cif);
  const [closedYears, setClosedYears] = useState(initial.closedYears);
  const [forecastYear, setForecastYear] = useState(initial.forecastYear);
  // t91: the tab lives in the URL (?tab=ficha) and the server reads it, so the first paint is already the right tab.
  const [tab, setTabState] = useState<"company" | "deal">(focus === null && initialTab === "deal" ? "deal" : "company");
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

  const [saveTarget, setSaveTarget] = useState("");
  const [rejectedSave, setRejectedSave] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [suppressStatus, setSuppressStatus] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  // t78: /mi-empresa/detalles is only reachable with a verified NIF (stored CIF); the server enforces the lock too.
  const identityLocked = cif.trim().length > 0;
  const [changeField, setChangeField] = useState<IdentityField | null>(null);
  const [saveClosed, setSaveClosed] = useState("");


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
    sellerFinancing: initial.sellerFinancing as string,
    sellerFinancingPct: initial.sellerFinancingPct,
    sellerFinancingYears: initial.sellerFinancingYears,
    sellerStay: initial.sellerStay as string,
    ownerDependence: initial.ownerDependence,
    premisesKind: initial.premisesKind,
    rentMonthly: initial.rentMonthly,
    leaseYearsRemaining: initial.leaseYearsRemaining,
    recurringRevenuePct: initial.recurringRevenuePct,
    askingPriceIncludes: storedAskingPriceIncludes(initial.askingPriceIncludes),
    closedYears: initial.closedYears,
    forecastYear: initial.forecastYear,
  }));
  const [seenSave, setSeenSave] = useState<CompanyDraftState>(null);
  const [submittedDraft, setSubmittedDraft] = useState<typeof baseline | null>(null);
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
    sellerFinancing,
    sellerFinancingPct,
    sellerFinancingYears,
    sellerStay,
    ownerDependence,
    premisesKind,
    rentMonthly,
    leaseYearsRemaining,
    recurringRevenuePct,
    askingPriceIncludes,
    closedYears,
    forecastYear,
  };

  if (state?.saved && state !== seenSave) {
    setSeenSave(state);
    // t95: autosave can run while the seller keeps typing; only what was sent counts as saved.
    setBaseline(submittedDraft ?? currentDraft);
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
    !sameList(secondaryCnaes, baseline.secondaryCnaes) ||
    sellerFinancing !== baseline.sellerFinancing ||
    sellerFinancingPct !== baseline.sellerFinancingPct ||
    sellerFinancingYears !== baseline.sellerFinancingYears ||
    sellerStay !== baseline.sellerStay;
  const structureDirty =
    !sameList(capitalPercents, baseline.capitalPercents) ||
    !sameList(productPercents, baseline.productPercents) ||
    !sameList(clientPercents, baseline.clientPercents) ||
    customerBase !== baseline.customerBase ||
    ownerDependence !== baseline.ownerDependence ||
    premisesKind !== baseline.premisesKind ||
    rentMonthly !== baseline.rentMonthly ||
    leaseYearsRemaining !== baseline.leaseYearsRemaining ||
    recurringRevenuePct !== baseline.recurringRevenuePct;
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
    askingPrice !== baseline.askingPrice ||
    askingPriceIncludes !== baseline.askingPriceIncludes;

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
    setTabState(next);
    const url = new URL(window.location.href);
    if (next === "deal") {
      url.searchParams.set("tab", "ficha");
      url.searchParams.delete("seccion");
    } else {
      url.searchParams.delete("tab");
    }
    window.history.replaceState(window.history.state, "", url);
  }



  // t95: Enter in a field saves now instead of a native submit; the autosave path handles every save.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    autoSaveRef.current();
  }

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
  // t85: net result of the account year, read from the stored accounts (detailRows), never typed by the seller.
  const netResultCents = (() => {
    const row = fichaExtras?.detailRows?.find((line) => line.key === "netResultCents");
    const column = accountYear ? (fichaExtras?.detailYears ?? []).findIndex((column) => String(column.year) === accountYear.year) : -1;
    return row && column >= 0 ? (row.values[column] ?? null) : null;
  })();
  // t82: live bridge base = the stored accounts EBITDA the server will use, else the loaded statements.
  const storedEbitdaCents = signedEuroPattern.test(ebitda.trim()) ? eurosToCents(ebitda.trim()) : null;
  const adjustmentBaseCents =
    storedEbitdaCents !== null && (storedEbitdaCents !== 0 || ebitdaCentsFromAccounts === null) ? storedEbitdaCents : ebitdaCentsFromAccounts;
  const approvedSumCents = adjustmentRows.reduce((total, row) => (row.status === "approved" ? total + (formRowAmountCents(row.amount) ?? 0) : total), 0);
  const pendingAdjustments = adjustmentRows.filter((row) => row.status !== "approved").length;
  const approvedAdjustmentsCount = adjustmentRows.length - pendingAdjustments;
  const legacyAdjustedCents = !hadAdjustmentList && signedEuroPattern.test(initial.adjustedEbitda.trim()) ? eurosToCents(initial.adjustedEbitda.trim()) : 0;
  const adjustedEbitda =
    approvedAdjustmentsCount > 0
      ? adjustmentBaseCents === null
        ? ""
        : eurosToCentsLabel(adjustmentBaseCents + approvedSumCents)
      : adjustmentRows.length === 0 && hadAdjustmentList
        ? "0"
        : adjustmentRows.length > 0
          ? ""
          : initial.adjustedEbitda;
  // Published figure: only rows an admin has accepted. Pending rows stay on the tile as "por aprobar".
  const priceBasis = priceBasisCents({
    hasAdjustments: approvedAdjustmentsCount > 0 || (adjustmentRows.length === 0 && legacyAdjustedCents !== 0),
    adjustedEbitdaCents: signedEuroPattern.test(adjustedEbitda.trim()) ? eurosToCents(adjustedEbitda.trim()) : null,
    ebitdaCents: storedEbitdaCents !== null && storedEbitdaCents !== 0 ? storedEbitdaCents : ebitdaCentsFromAccounts,
  });
  const priceBlocked = !askingPriceAllowed(priceBasis);
  const weightedEbitda = weightedEbitdaCents(ebitdaByYear(closedYears));
  const priceEstimate = estimatePriceRange({
    cnae: principalCnae,
    ebitdaCents: priceBlocked ? null : (weightedEbitda?.cents ?? (priceBasis !== null && priceBasis > 0 ? priceBasis : null)),
    headcount: (valuationHeadcounts as readonly string[]).includes(headcount) ? (headcount as HeadcountRangeId) : null,
    revenueGrowth: salesGrowth(closedYears),
    ebitdaTrend: ebitdaTrend(ebitdaByYear(closedYears)),
  });
  const priceRangeNote =
    weightedEbitda === null
      ? null
      : weightedEbitda.years.length === 1
        ? companyCopy.priceRangeNoteOne
        : weightedEbitda.years.length === 2
          ? companyCopy.priceRangeNoteTwo
          : companyCopy.priceRangeNoteThree;
  const dealNote = `${
    accountYear && salesFromAccounts
      ? (ebitdaFromAccounts ? companyCopy.dealReflectsBoth : companyCopy.dealReflectsSales).replace("{year}", accountYear.year)
      : companyCopy.euroHint
  }`;
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
    sellerFinancing: sellerFinancing as CompanyDraftInput["sellerFinancing"],
    sellerFinancingPct,
    sellerFinancingYears,
    sellerStay: sellerStay as CompanyDraftInput["sellerStay"],
    ownerDependence: ownerDependence as CompanyDraftInput["ownerDependence"],
    premisesKind: premisesKind as CompanyDraftInput["premisesKind"],
    rentMonthly,
    leaseYearsRemaining,
    recurringRevenuePct,
    askingPriceIncludes,
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
    tab === "company" &&
    state &&
    !state.saved &&
    !suppressStatus &&
    !percentSumMessages.has(state.message) &&
    state.message !== companyCopy.descriptionTooShort
      ? state.message
      : null;
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
    sellerFinancing,
    sellerStay,
  });
  // t78: a section is "done" only when all its required fields are (was: structure done as soon as headcount was set).
  const basicDone = sectionComplete(requiredFields, "basic");
  const structureDone = sectionComplete(requiredFields, "structure");
  const priceDone = sectionComplete(requiredFields, "deal");
  const companySections: DetailSectionItem[] = [
    { id: "panel-basic", label: companyCopy.basicTitle, status: basicDirty ? "dirty" : basicDone ? "done" : "pending" },
    { id: "panel-price", label: companyCopy.fichaFieldsTitle, status: dealDirty ? "dirty" : priceDone ? "done" : "pending" },
    { id: "panel-structure", label: companyCopy.structureHeading, status: structureDirty ? "dirty" : structureDone ? "done" : "pending" },
    { id: "panel-figures", label: "Tus cifras", status: figuresLoaded ? "done" : "info" },
    ...(financeExtra ? [{ id: "panel-sabi-registry", label: "Datos del registro", status: "info" as const }] : []),
  ];
  // t79/t80: the right-hand checklist groups each required field under its section. It covers this tab only: the asking
  // price lives on Ficha pública and listing it here (as a separate "Ficha pública" group) confused sellers.
  // t86: the asking price now sits in Datos de la ficha on this tab, so it is listed too.
  const companyFields = requiredFields;
  const navProgress = {
    ...completionProgress(companyFields),
    fields: companyFields.map((field) => ({
      id: field.id,
      label: field.label,
      done: field.done,
      required: field.required,
      group: field.section === "basic" ? "panel-basic" : field.section === "deal" ? "panel-price" : "panel-structure",
    })),
  };
  const dirtySections = [
    { id: "basic", label: companyCopy.basicTitle, dirty: basicDirty },
    { id: "structure", label: companyCopy.structureHeading, dirty: structureDirty },
    { id: "income", label: "Tus cifras", dirty: incomeDirty || balanceDirty },
    { id: "deal", label: companyCopy.fichaFieldsTitle, dirty: dealDirty },
  ].filter((section) => section.dirty);

  // t95: autosave replaces the "Cambios sin guardar" bar. Text saves ~800 ms after typing stops (or on blur); selects,
  // toggles and option menus save at once. A field that fails the browser's own validation keeps its last saved value in
  // the request, so one bad field never blocks the others; the field itself stays marked until fixed.
  const draftKey = JSON.stringify(currentDraft);
  const [savingSections, setSavingSections] = useState<string[]>([]);
  const [lastSentKey, setLastSentKey] = useState("");
  const typedAt = useRef(0);
  const saveTimer = useRef<number | null>(null);
  const savedForm = useRef<FormData | null>(null);
  const sentForm = useRef<FormData | null>(null);

  function runAutoSave() {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const form = formRef.current;
    if (!form || pending || !formDirty) return;
    const blocked = saveBlockReason([capitalPercents, productPercents, clientPercents]);
    const data = new FormData(form);
    if (blocked) {
      // Percent splits that do not add up stay local until fixed (the message shows in Estructura); the rest saves.
      for (const name of ["capitalPercent", "productPercent", "clientPercent"]) {
        data.delete(name);
        for (const value of savedForm.current?.getAll(name) ?? []) data.append(name, value);
      }
    }
    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
      if (!element.name || element.validity.valid) continue;
      const kept = savedForm.current?.getAll(element.name);
      if (kept) {
        data.delete(element.name);
        for (const value of kept) data.append(element.name, value);
      }
    }
    const ids = dirtySections.map((section) => section.id);
    setSavingSections(ids);
    setSaveTarget(ids[0] ?? "basic");
    setAttempt((current) => current + 1);
    setRejectedSave(blocked ? "structure" : "");
    setSuppressStatus(Boolean(blocked));
    setClientError(blocked);
    setSubmittedDraft(
      blocked
        ? { ...currentDraft, capitalPercents: baseline.capitalPercents, productPercents: baseline.productPercents, clientPercents: baseline.clientPercents }
        : currentDraft,
    );
    setLastSentKey(draftKey);
    sentForm.current = data;
    void action(data);
  }
  const autoSaveRef = useRef(runAutoSave);
  useEffect(() => {
    autoSaveRef.current = runAutoSave;
  });

  useEffect(() => {
    const form = formRef.current;
    if (form && savedForm.current === null) savedForm.current = new FormData(form);
  }, []);

  useEffect(() => {
    if (state?.saved && sentForm.current) savedForm.current = sentForm.current;
  }, [state]);

  useEffect(() => {
    if (!formDirty || pending) return;
    // Each edit is sent once: a failed save waits for a new edit or "Reintentar", and a draft that stays dirty after
    // saving (a percent split that does not add up) is not re-sent in a loop.
    if (draftKey === lastSentKey) return;
    const typing = Date.now() - typedAt.current < 150;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => autoSaveRef.current(), typing ? 800 : 0);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [draftKey, formDirty, pending, lastSentKey]);

  // t95: closing or reloading the tab flushes a pending save (the browser still asks while it is in flight).
  useEffect(() => {
    function flush() {
      if (saveTimer.current !== null) autoSaveRef.current();
    }
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  function sectionSaveState(...ids: string[]): AutoSaveState {
    if (!ids.some((id) => savingSections.includes(id))) return null;
    if (pending) return "saving";
    if (!state) return null;
    return state.saved ? "saved" : "error";
  }

  // t88: deep links from Inicio (/mi-empresa/detalles?seccion=x#anchor). The browser's own hash jump fires before
  // hydration, while panels are still closed, so it landed at the bottom of the page. After render: open the panel that
  // holds the anchor, wait for the element, expand any <details> around it, centre it and highlight it.
  const deepLinkDone = useRef(false);
  useEffect(() => {
    if (deepLinkDone.current) return;
    deepLinkDone.current = true;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const ancla = new URLSearchParams(window.location.search).get("ancla") ?? "";
    const id = hash || (/^panel-[\w-]+$/.test(ancla) ? ancla : "") || (focus ? `panel-${focus}` : "");
    if (!id) return;
    const field = requiredFields.find((item) => item.id === id);
    if (field?.section === "basic") setOpenBasic(true);
    if (field?.section === "structure") setOpenStructure(true);
    let cancelled = false;
    const started = Date.now();
    function attempt() {
      if (cancelled) return;
      const target = document.getElementById(id);
      if (!target) {
        if (Date.now() - started < 4000) window.setTimeout(attempt, 100);
        return;
      }
      for (let node = target.parentElement; node; node = node.parentElement) {
        if (node instanceof HTMLDetailsElement && !node.open) node.open = true;
      }
      // Two frames so the opened panels have laid out before measuring.
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => !cancelled && highlightTarget(target, true)));
    }
    window.setTimeout(attempt, 50);
    return () => {
      cancelled = true;
    };
    // Runs once, on the first render after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // t78/t79: checklist links open the panel (and tab) that holds the field, then scroll to it.
  function goToMissing(id: string): boolean {
    const field = requiredFields.find((item) => item.id === id);
    if (!field) {
      return false;
    }
    setSaveClosed("");
    if (field.section === "basic") setOpenBasic(true);
    if (field.section === "structure") setOpenStructure(true);
    if (field.section === "deal") setTab("company");
    window.setTimeout(() => {
      const target = document.getElementById(id);
      if (target) highlightTarget(target);
    }, 60);
    return true;
  }

  // t95: leaving flushes the pending autosave, then navigates once it lands (stays put with the error if it fails).
  function saveAndLeave(href: string) {
    leaveHrefRef.current = href;
    if (pending) {
      return;
    }
    if (!formDirty) {
      leaveHrefRef.current = null;
      router.push(href);
      return;
    }
    runAutoSave();
  }

  return (
    <>
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onInput={(event) => {
        const target = event.target;
        if (target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type !== "checkbox" && target.type !== "radio")) {
          typedAt.current = Date.now();
        }
      }}
      onBlur={() => {
        if (saveTimer.current !== null) autoSaveRef.current();
      }}
      className="flex flex-col gap-4"
    >
      <UnsavedChangesGuard
        dirty={formDirty || pending}
        onSave={saveAndLeave}
        autoSave
        failedHref={leaveFailedHref}
        onDismissFailed={() => setLeaveFailedHref(null)}
      />
      <IdentityChangeDialog field={changeField} values={{ legalName, cif: nif }} onClose={() => setChangeField(null)} />
      <h1 className="min-w-0 text-2xl tracking-tight text-public-ink sm:text-3xl">
        {sellerCopy.detailsTitle}
      </h1>
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
      <div className="relative flex flex-col gap-4">
      {tab === "company" ? <DetailSectionNav items={companySections} progress={navProgress} onMissing={goToMissing} /> : null}
      <div className="flex min-w-0 flex-col gap-4">
      {/* t84: bottom spacer so "Ir" can centre fields in the last panels too. */}
      <div className={tab === "company" ? "flex flex-col gap-4 pb-24 lg:pb-[35vh]" : "hidden"}>
      <Panel
        id="panel-basic"
        saveState={sectionSaveState("basic")}
        onRetry={() => autoSaveRef.current()}
        step={1}
        title={companyCopy.basicTitle}
        intro="Nombre, motivo de venta, descripción, sector y cómo sería el traspaso."
        open={saveClosed === "basic" ? false : openBasic}
        dirty={basicDirty}
        done={basicDone}
        onEdit={() => {
          setSaveClosed("");
          setOpenBasic(true);
        }}
        onCollapse={() => setOpenBasic(false)}
      >
        <div className="@container grid gap-6 md:grid-cols-2">
          {identityLocked ? (
            <div className="col-span-2 grid grid-cols-1 gap-6 @min-[24rem]:grid-cols-2">
              <Fact id="panel-identity" icon={Building2} label={companyCopy.factName}>
                <LockedIdentityInput name="legalName" value={legalName} />
              </Fact>
              <Fact icon={FileSpreadsheet} label={companyCopy.factNif}>
                <LockedIdentityInput name="cif" value={nif} onRequest={() => setChangeField("cif")} />
              </Fact>
            </div>
          ) : (
            <div className="col-span-2 grid grid-cols-1 gap-6 @min-[24rem]:grid-cols-2">
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
            </div>
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
            <FieldHint text={companyCopy.descriptionGuide} />
          </span>
          <div className="relative">
            {description.length > 80 ? (
              <span className="absolute top-2.5 left-2.5 z-10">
                <InfoHint text={companyCopy.descriptionProgress} icon="warning" tone="warning" />
              </span>
            ) : null}
            <Textarea
              name="description"
              data-flash
              rows={4}
              maxLength={descriptionMaxLength}
              placeholder={companyCopy.descriptionPlaceholder}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-label={companyCopy.descriptionLabel}
              aria-required="true"
              aria-invalid={description.trim().length > 0 && description.trim().length < descriptionMinLength ? true : undefined}
              className={description.length > 80 ? "pl-9" : undefined}
            />
          </div>
          <span className="flex flex-wrap items-start justify-between gap-2 text-sm text-[#667085]">
            {description.trim().length > 0 && description.trim().length < descriptionMinLength ? (
              <span role="status" className="text-[#c0362c]">
                {companyCopy.descriptionTooShort}
              </span>
            ) : (
              <span />
            )}
            <span>
              {companyCopy.descriptionCounter
                .replace("{count}", String(description.trim().length))
                .replace("{max}", String(descriptionMaxLength))
                .replace("{min}", String(descriptionMinLength))}
            </span>
          </span>
        </div>
        <div id="panel-cnae" className="grid scroll-mt-6 gap-4 md:grid-cols-2">
          <CnaeSelect name="principalCnae" label={companyCopy.principalCnaeLabel} value={principalCnae} onChange={setPrincipalCnae} />
          <div className="flex flex-col gap-3">
            <div className="flex h-9 items-center justify-start gap-2">
              <p className="text-sm font-medium">
                {companyCopy.secondaryCnaeLabel} (máximo {maxSecondaryCnaes})
              </p>
              <span data-flash className="inline-flex rounded-full">
              <AddIconButton
                label={companyCopy.addSecondaryCnae}
                disabled={secondaryCnaes.length >= maxSecondaryCnaes}
                onClick={() => {
                  setSecondaryCnaes((current) => [...current, ""]);
                }}
              />
              </span>
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
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <SellerFinancingField
            mode={sellerFinancing}
            pct={sellerFinancingPct}
            years={sellerFinancingYears}
            onMode={setSellerFinancing}
            onPct={setSellerFinancingPct}
            onYears={setSellerFinancingYears}
          />
          <SellerStayField value={sellerStay} onChange={setSellerStay} />
        </div>
      </Panel>

      {/* t87: Datos de la ficha (apodo, fotos, precio, EBITDA ajustado) is step 2, right under Tu empresa, so sellers find the price early. */}
      <Panel
        id="panel-price"
        saveState={sectionSaveState("deal")}
        onRetry={() => autoSaveRef.current()}
        step={2}
        title={companyCopy.fichaFieldsTitle}
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
            photos={fichaExtras?.photos ?? []}
            onListed={setListedPhoto}
            onCodename={setCodename}
          >
            <input type="hidden" name="ebitdaAdjustments" value={adjustmentsJson} />
            <FichaMetrics
              revenue={salesFromAccounts ?? revenue}
              askingPrice={askingPrice}
              onAskingPrice={setAskingPrice}
              ebitda={ebitdaFromAccounts ?? ebitda}
              adjustedEbitda={adjustedEbitda}
              adjustmentCount={approvedAdjustmentsCount}
              pendingCount={pendingAdjustments}
              adjustments={(close) => (
                <EbitdaAdjustmentsDialog
                  rows={adjustmentRows}
                  onSaved={(rows, json) => {
                    setAdjustmentRows(rows);
                    setHadAdjustmentList(json !== "");
                    setBaseline((current) => ({ ...current, ebitdaAdjustments: json }));
                  }}
                  onClose={close}
                  baseCents={adjustmentBaseCents}
                  year={accountYear?.year ?? null}
                  legacyCents={legacyAdjustedCents !== 0 ? legacyAdjustedCents : null}
                  uploadsDisabled={uploadsDisabled}
                />
              )}
              margin={marginText(salesFromAccounts ?? revenue, ebitdaFromAccounts ?? ebitda)}
              netResult={netResultCents !== null ? eurosToCentsLabel(netResultCents) : ""}
              priceBlocked={priceBlocked}
              recommended={
                priceEstimate
                  ? {
                      amount: wholeEur(recommendedPriceCents(priceEstimate)),
                      onUse: () => setAskingPrice(recommendedPriceInput(priceEstimate)),
                      applied: euroCentsOrNull(askingPrice) === recommendedPriceCents(priceEstimate),
                    }
                  : null
              }
              priceStatus={
                <PriceStatus
                  estimate={priceEstimate}
                  askingCents={euroCentsOrNull(askingPrice)}
                  blocked={priceBlocked}
                  rangeNote={priceRangeNote}
                />
              }
              askingPriceIncludes={askingPriceIncludes}
              onAskingPriceIncludes={setAskingPriceIncludes}
            />
          </PublicFicha>
      </Panel>

      <Panel
        id="panel-structure"
        saveState={sectionSaveState("structure")}
        onRetry={() => autoSaveRef.current()}
        step={3}
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
        {clientError ? (
          <p role="alert" className="mb-3 rounded-xl bg-[#fdecea] px-3 py-2 text-sm text-[#a12f2f]">
            {clientError} No se guarda este bloque hasta que cuadre; el resto sí.
          </p>
        ) : null}
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
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Fact icon={Users} label={companyCopy.ownerDependenceLabel}>
            <OptionSelect
              name="ownerDependence"
              label={companyCopy.ownerDependenceLabel}
              placeholder={companyCopy.ownerDependenceEmpty}
              value={ownerDependence}
              options={[
                { value: "", label: companyCopy.ownerDependenceEmpty },
                { value: "low", label: companyCopy.ownerDependenceLow },
                { value: "medium", label: companyCopy.ownerDependenceMedium },
                { value: "high", label: companyCopy.ownerDependenceHigh },
              ]}
              onValueChange={(value) => {
                if (value === "" || ownerDependenceLevels.some((item) => item === value)) {
                  setOwnerDependence(value as typeof ownerDependence);
                }
              }}
            />
          </Fact>
          <Fact icon={Building2} label={companyCopy.premisesLabel}>
            <OptionSelect
              name="premisesKind"
              label={companyCopy.premisesLabel}
              placeholder={companyCopy.premisesEmpty}
              value={premisesKind}
              options={[
                { value: "", label: companyCopy.premisesEmpty },
                { value: "owned", label: companyCopy.premisesOwned },
                { value: "rent", label: companyCopy.premisesRent },
              ]}
              onValueChange={(value) => {
                if (value === "" || premisesKinds.some((item) => item === value)) {
                  setPremisesKind(value as typeof premisesKind);
                }
              }}
            />
          </Fact>
          {premisesKind === "rent" ? (
            <>
              <Fact icon={MapPin} label={companyCopy.rentMonthlyLabel}>
                <Input
                  name="rentMonthly"
                  inputMode="decimal"
                  value={rentMonthly}
                  onChange={(event) => setRentMonthly(keepUnsignedEuro(event.target.value))}
                />
              </Fact>
              <Fact icon={CalendarDays} label={companyCopy.leaseYearsLabel}>
                <Input
                  name="leaseYearsRemaining"
                  inputMode="numeric"
                  value={leaseYearsRemaining}
                  onChange={(event) => setLeaseYearsRemaining(keepDigits(event.target.value, 2))}
                />
              </Fact>
            </>
          ) : null}
          <Fact icon={Handshake} label={companyCopy.recurringRevenueLabel}>
            <Input
              name="recurringRevenuePct"
              inputMode="numeric"
              value={recurringRevenuePct}
              onChange={(event) => setRecurringRevenuePct(keepDigits(event.target.value, 3))}
            />
          </Fact>
        </div>
      </Panel>

      <SellerFiguresCard step={4} figures={investorPreview} reportYears={reportYears} />
      {/* t76: raw accounting inputs are not for sellers; they stay mounted (hidden) so saving keeps the loaded values. */}
      <div hidden>
      <Panel
        id="panel-income"
        saveState={sectionSaveState("income")}
        onRetry={() => autoSaveRef.current()}
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
        saveState={sectionSaveState("income")}
        onRetry={() => autoSaveRef.current()}
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
      <Panel
        id="panel-ficha-preview"
        title={companyCopy.detailsDealTab}
        open
        fixed
        chip={false}
        done={false}
        dirty={false}
        onEdit={() => undefined}
        onCollapse={() => undefined}
      >
        <p className="-mt-2 mb-4 text-sm text-[#5c6b78]">{companyCopy.fichaPreviewIntro}</p>
        <div className="flex flex-col gap-4">
          <MarketPreview
            codename={codename}
            region={region}
            revenue={salesFromAccounts ?? revenue}
            ebitda={ebitdaFromAccounts ?? ebitda}
            adjustedEbitda={adjustedEbitda}
            hasAdjustments={approvedAdjustmentsCount > 0}
            askingPrice={askingPrice}
            principalCnae={principalCnae}
            summary={description}
            financingChip={sellerFinancingChip(storedSellerFinancing({ sellerFinancing }))}
            publishable={!priceBlocked}
          />
        </div>
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
            sector={principalCnae ? sectorKeyFromCnae(principalCnae) : null}
            chips={bannerChips({ sector: principalCnae ? sectorKeyFromCnae(principalCnae) : null, region: investorPreview.region, foundedYear })}
          />
          <div id="ficha-section-nav-slot" />
          <CompanyReport navBelowTabs showSectionNav={tab === "deal"} project={previewProject} sellerPreview={{
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
          }} role="buyer" figuresOpen={previewOpen} lockedNote={companyCopy.figuresLocked} lockAction={
            // t91: the real pre-NDA buyer view, CTA included; in the preview it is only a picture of the button.
            <span className="inline-flex h-11 cursor-default items-center justify-center rounded-xl bg-[#1c2740] px-5 text-sm font-medium text-white" title="Vista previa: así ve el botón el comprador">
              {accessCopy.connect}
            </span>
          } />
        </div>
      </Panel>
      </div>
      </div>
      </div>

      {tab === "company" && statusMessage ? (
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

function PublicFicha({
  codename,
  coverSrc,
  photos,
  onListed,
  onCodename,
  children,
}: {
  codename: string;
  coverSrc: string | null;
  photos: GalleryPhoto[];
  onListed: (listed: boolean) => void;
  onCodename: (value: string) => void;
  children: ReactNode;
}) {
  const [regenerating, startRegenerate] = useTransition();
  const imageSrc = projectImageSrc(projectSlug(codename));
  const recommended = photos.length === 0 && !coverSrc && !imageSrc;

  return (
    <>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-[1_1_15rem] flex-col gap-2">
          {/* t91: "Generar otro" is a small link on the label row, top right of the name field. */}
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#2b3b4a]">
              <label htmlFor="project-codename" className="whitespace-nowrap">
                {companyCopy.codenameLabel}
              </label>
              <FieldHint text={companyCopy.codenameHint} />
            </span>
            <button
              type="button"
              disabled={regenerating}
              aria-controls="project-codename"
              onClick={() => {
                startRegenerate(async () => {
                  onCodename(await generateCodenameAction(codename));
                });
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-medium text-[#0f766e] hover:text-[#1c2740] hover:underline focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${regenerating ? "animate-spin" : ""}`} aria-hidden />
              {companyCopy.codenameRegenerate}
            </button>
          </div>
          <Input
            id="project-codename"
            name="codename"
            required
            readOnly
            value={codename}
            aria-live="polite"
            className="min-w-0 bg-[#f7f8fb] text-[#1c2740]"
          />
        </div>
        <div className="min-w-0 flex-[1_1_15rem]">
          <CardPhotoUploader photos={photos} recommended={recommended} onCount={(count) => onListed(count > 0 || Boolean(imageSrc))} />
        </div>
      </div>
      {children}
    </>
  );
}

function MarketPreview({
  codename,
  region,
  revenue,
  ebitda,
  adjustedEbitda,
  hasAdjustments = false,
  askingPrice,
  principalCnae = "",
  summary = "",
  financingChip = null,
  publishable = true,
}: {
  codename: string;
  region: string;
  revenue: string;
  ebitda: string;
  adjustedEbitda: string;
  hasAdjustments?: boolean;
  askingPrice: string;
  principalCnae?: string;
  summary?: string;
  financingChip?: string | null;
  publishable?: boolean;
}) {
  // The preview is the real marketplace card, so it can never drift from it.
  const card: PublicProjectCard = {
    slug: "vista-previa",
    codename: codename.trim().length > 0 ? codename : companyCopy.codenameLabel,
    region: region.trim().length > 0 ? region : companyCopy.regionLabel,
    revenueCents: previewCents(revenue) ?? 0,
    ebitdaCents: signedEuroPattern.test(ebitda.trim()) ? eurosToCents(ebitda.trim()) : 0,
    adjustedEbitdaCents: signedEuroPattern.test(adjustedEbitda.trim()) ? eurosToCents(adjustedEbitda.trim()) : 0,
    hasAdjustments,
    askingPriceCents: previewCents(askingPrice) ?? 0,
    sectorKey: principalCnae ? sectorKeyFromCnae(principalCnae) : undefined,
    cnaeCode: principalCnae || null,
    cnaeTitle: principalCnae ? cnaeTitleOf(principalCnae) : null,
    summary: summary.trim() || null,
    financingChip,
    publishable,
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
        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
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

function previewCents(value: string): number | null {
  const trimmed = value.trim();
  if (!unsignedEuroPattern.test(trimmed)) {
    return null;
  }

  return optionalEurosToCents(trimmed);
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

/**
 * t85/t87/t88: centre a field and give it the teal highlight Descripción shows via its focus ring (chip groups and plus
 * buttons included). `settle` re-centres once if late content (charts, images) moved it during the smooth scroll.
 */
function highlightTarget(target: HTMLElement, settle = false) {
  const flashTarget =
    target.matches("[data-flash]")
      ? target
      : (target.querySelector<HTMLElement>("[data-flash]") ??
        target.querySelector<HTMLElement>("input:not([type='hidden']), textarea, select, button:not([aria-hidden]), [role='radiogroup']") ??
        target);
  const focusTarget = flashTarget.matches("input, textarea, select, button")
    ? flashTarget
    : (flashTarget.querySelector<HTMLElement>("input:not([type='hidden']), textarea, select, button") ?? flashTarget);
  scrollToCenter(flashTarget);
  focusTarget.focus({ preventScroll: true });
  const flash = [
    flashTarget.tagName === "INPUT" || flashTarget.tagName === "TEXTAREA" || flashTarget.tagName === "BUTTON" || flashTarget.getAttribute("role") === "radiogroup"
      ? "rounded-xl"
      : "rounded-full",
    "ring-2",
    "ring-[#2fc4b2]",
    "ring-offset-4",
    "ring-offset-white",
  ];
  flashTarget.classList.add(...flash);
  window.setTimeout(() => flashTarget.classList.remove(...flash), 2400);
  if (settle) {
    window.setTimeout(() => {
      const rect = flashTarget.getBoundingClientRect();
      const drift = Math.abs(rect.top + rect.height / 2 - (window.innerHeight + 80) / 2);
      if (drift > 120) scrollToCenter(flashTarget);
    }, 900);
  }
}
