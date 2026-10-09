"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { rememberSessionFlag, usePanelOpen, useSessionChoice } from "@/components/session-flag";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building2, CalendarDays, ChevronDown, ChevronUp, CircleCheck, Clock, FileSpreadsheet, Heart, ImagePlus, Map, MapPin, Pencil, Users, X } from "lucide-react";
import { sellerCopy } from "@/lib/seller-copy";
import type { AnnualAccountsState } from "@/app/mi-empresa/accounts-actions";
import { saveCompanyDraftAction, type CompanyDraftState } from "@/app/mi-empresa/actions";
import { AccountsUpload } from "@/components/accounts-upload";
import { CompanySetup } from "@/components/company-setup";
import { FieldHint } from "@/components/field-hint";
import { CompanyBanner } from "@/components/company-banner";
import { CompanyProfile } from "@/components/company-profile-view";
import { MarketCardFigures } from "@/components/market-card-figures";
import { PhotoScrim, projectPhotoFrame, ProjectPhotoMark } from "@/components/project-photo";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { SellerTabs } from "@/components/seller-tabs";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";
import { cnaeClasses } from "@/lib/cnae-2009";
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

const fieldClassName =
  "h-11 w-full rounded-[14px] border border-[#e7eaee] bg-white px-3 text-base text-[#2b3b4a] outline-none focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20";

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
  if (!unsignedEuroPattern.test(revenue.trim()) || !unsignedEuroPattern.test(ebitda.trim())) {
    return companyCopy.unavailable;
  }

  const basisPoints = ebitdaMarginBasisPoints(eurosToCents(ebitda), eurosToCents(revenue));
  return basisPoints === null ? companyCopy.unavailable : formatBasisPoints(basisPoints);
}

function Panel({
  id,
  title,
  intro,
  hint,
  open,
  done,
  dirty,
  onEdit,
  onCollapse,
  children,
}: {
  id?: string;
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
    <section id={id} className="scroll-mt-6 rounded-2xl border border-[#e7eaee] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
            {title}
            {hint ? <FieldHint text={hint} /> : null}
          </h2>
          {open ? null : intro ? <p className="mt-1 text-sm text-[#64748b]">{intro}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {open && dirty ? (
            <span className="inline-flex h-7 items-center gap-1 rounded-md bg-[#fff4d6] px-2 text-sm font-semibold text-[#8a6112]">
              <Pencil className="size-4" aria-hidden />
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
          {open ? (
            <button
              type="button"
              aria-expanded="true"
              onClick={onCollapse}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] bg-white px-3 text-sm"
            >
              <ChevronUp className="size-3.5" aria-hidden />
              {companyCopy.collapsePanel}
            </button>
          ) : (
            <button
              type="button"
              aria-expanded="false"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] bg-white px-3 text-sm"
            >
              <Pencil className="size-3.5" aria-hidden />
              {companyCopy.editPanel}
            </button>
          )}
        </div>
      </div>
      <div className={open ? "mt-4" : "hidden"}>{children}</div>
    </section>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={companyCopy.removeRow}
      onClick={onClick}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[#f0c2c2] bg-white text-[#c0362c] hover:bg-[#fff1f1]"
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
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (next: string) => void;
  locked?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const shown = editing ? value : groupedEuro(value);
  const amount = shown.length > 0 ? shown : "—";

  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-[11px] font-semibold tracking-wide text-[#667085] uppercase">{label}</span>
      <input type="hidden" name={name} value={value} />
      {locked || !onChange ? (
        <span className="text-xl font-semibold tracking-tight text-[#1c2740] tabular-nums">
          {amount}
          <span className="ml-1 text-sm font-medium text-[#667085]">€</span>
        </span>
      ) : (
        <span className="inline-flex max-w-full items-baseline gap-1.5">
          <input
            inputMode="decimal"
            value={shown}
            placeholder="0"
            onFocus={() => {
              setEditing(true);
            }}
            onBlur={() => {
              setEditing(false);
            }}
            onChange={(event) => {
              onChange(keepUnsignedEuro(event.target.value));
            }}
            className="field-sizing-content max-w-full min-w-[1ch] bg-transparent text-xl font-semibold tracking-tight text-[#1c2740] tabular-nums outline-none"
          />
          <span className="text-sm font-medium text-[#667085]">€</span>
        </span>
      )}
    </label>
  );
}

function FichaMetrics({
  revenue,
  revenueLocked,
  onRevenue,
  opex,
  onOpex,
  askingPrice,
  onAskingPrice,
  ebitda,
  ebitdaLocked,
  onEbitda,
  adjustedEbitda,
  onAdjustedEbitda,
  margin,
}: {
  revenue: string;
  revenueLocked: boolean;
  onRevenue: (value: string) => void;
  opex: string;
  onOpex: (value: string) => void;
  askingPrice: string;
  onAskingPrice: (value: string) => void;
  ebitda: string;
  ebitdaLocked: boolean;
  onEbitda: (value: string) => void;
  adjustedEbitda: string;
  onAdjustedEbitda: (value: string) => void;
  margin: string;
}) {
  const cells = [
    { id: "asking-price", frame: metricCellFrame(0), node: <FigureField label={companyCopy.askingPriceLabel} name="askingPrice" value={askingPrice} onChange={onAskingPrice} /> },
    {
      id: "margin",
      frame: metricCellFrame(1),
      node: (
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-wide text-[#667085] uppercase">{companyCopy.ebitdaMarginLabel}</span>
          <span className="text-xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{margin}</span>
        </div>
      ),
    },
    { id: "revenue", frame: metricCellFrame(2), node: <FigureField label={companyCopy.revenueLabel} name="revenue" value={revenue} onChange={onRevenue} locked={revenueLocked} /> },
    { id: "ebitda", frame: metricCellFrame(3), node: <FigureField label={companyCopy.ebitdaLabel} name="ebitda" value={ebitda} onChange={onEbitda} locked={ebitdaLocked} /> },
    { id: "adjusted", frame: metricCellFrame(4), node: <FigureField label={companyCopy.adjustedEbitdaLabel} name="adjustedEbitda" value={adjustedEbitda} onChange={onAdjustedEbitda} /> },
    { id: "opex", frame: metricCellFrame(5), node: <FigureField label={companyCopy.opexLabel} name="opex" value={opex} onChange={onOpex} /> },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-[#e7eaee] bg-white">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3">
        {cells.map((cell) => (
          <div key={cell.id} className={`border-[#eef0f3] p-4 ${cell.frame}`}>
            {cell.node}
          </div>
        ))}
      </div>
    </div>
  );
}

function metricCellFrame(index: number): string {
  const bottom = index < 5 ? "border-b" : "";
  const pairRight = index % 2 === 0 ? "sm:border-r" : "";
  const pairBottom = index >= 4 ? "sm:border-b-0" : "";
  const tripleRight = index % 3 === 2 ? "lg:border-r-0" : "lg:border-r";
  const tripleBottom = index >= 3 ? "lg:border-b-0" : "";
  return [bottom, pairRight, pairBottom, tripleRight, tripleBottom].filter((part) => part.length > 0).join(" ");
}

function SaveButton({
  id,
  pending,
  pendingId,
  rejected,
  shake,
  dirty,
  onChoose,
}: {
  id: string;
  pending: boolean;
  pendingId: string;
  rejected: boolean;
  shake: number;
  dirty: boolean;
  onChoose: (id: string) => void;
}) {
  const active = pending && pendingId === id;
  if (!dirty) {
    return null;
  }
  return (
    <div className="mt-4 flex justify-end">
      <button
        key={rejected ? `${id}-${shake}` : id}
        type="submit"
        name="savePanel"
        value={id}
        disabled={active}
        onClick={() => onChoose(id)}
        className={
          rejected
            ? "releva-shake inline-flex h-11 items-center rounded-[14px] bg-[#c0362c] px-4 text-base font-medium text-white"
            : "inline-flex h-11 items-center rounded-[14px] bg-[#465ab4] px-4 text-base font-medium text-white disabled:opacity-60"
        }
      >
        {active ? companyCopy.saving : companyCopy.save}
      </button>
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

  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      {select}
    </label>
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

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-base font-semibold text-[#1c2740]">{legend}</legend>
      <div className="flex flex-col gap-3">
      {values.map((value, index) => {
        const mark = over && index === values.length - 1;
        return (
        <div key={`${kind}-${index}`} className="flex items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            {draftSliceLabel(kind, index + 1)}
            <span className="relative block">
              <input
                name={name}
                inputMode="decimal"
                value={value}
                aria-invalid={mark}
                onChange={(event) => {
                  const next = keepPercent(event.target.value);
                  onChange(values.map((current, currentIndex) => (currentIndex === index ? next : current)));
                }}
                style={mark ? { boxShadow: "0 0 0 2px #c0362c" } : undefined}
                className={`${fieldClassName} pr-8`}
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
      <Button
        type="button"
        variant="outline"
        disabled={values.length >= maxActivitySlices}
        onClick={() => {
          onChange([...values, ""]);
        }}
      >
        {addLabel}
      </Button>
      </div>
    </fieldset>
  );
}

function Fact({
  id,
  icon: Icon,
  label,
  children,
}: {
  id?: string;
  icon: typeof Building2;
  label: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="grid scroll-mt-6 grid-cols-[2.75rem_minmax(0,1fr)] items-end gap-3">
      <span className="inline-flex size-11 items-center justify-center rounded-md bg-[#eef2ff] p-2.5 text-[#465ab4]">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="mb-1 block text-sm text-[#64748b]">{label}</span>
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
    return "releva:panel:basic";
  }
  if (id === "income") {
    return "releva:panel:income";
  }
  if (id === "balance") {
    return "releva:panel:balance";
  }
  if (id === "structure") {
    return "releva:panel:structure";
  }
  if (id === "deal") {
    return "releva:panel:deal";
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
  promptSetup = false,
  reviewPending = false,
}: {
  draft: CompanyDraftInput | null;
  cif: string;
  focus?: SellerFocusPanel | null;
  promptSetup?: boolean;
  reviewPending?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const leaveHrefRef = useRef<string | null>(null);
  const sawLeavePending = useRef(false);
  const initial = draft ?? emptyCompanyDraft();
  const [state, action, pending] = useActionState<CompanyDraftState, FormData>(saveCompanyDraftAction, null);
  const [legalName, setLegalName] = useState(initial.legalName);
  const [address, setAddress] = useState(initial.address);
  const [codename, setCodename] = useState(initial.codename);
  const [region, setRegion] = useState(initial.region);
  const [foundedYear, setFoundedYear] = useState(initial.foundedYear);
  const [description, setDescription] = useState(initial.description);
  const [principalCnae, setPrincipalCnae] = useState(initial.principalCnae);
  const [secondaryCnaes, setSecondaryCnaes] = useState(initial.secondaryCnaes);
  const [revenue, setRevenue] = useState(initial.revenue);
  const [ebitda, setEbitda] = useState(initial.ebitda);
  const [adjustedEbitda, setAdjustedEbitda] = useState(initial.adjustedEbitda);
  const [opex, setOpex] = useState(initial.opex);
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
    "releva:seller-tab",
    focus === "price" ? "deal" : "company",
    ["company", "deal"],
  );
  const [tabPin, setTabPin] = useState<"company" | "deal" | null>(focus === "price" ? "deal" : null);
  const tab = tabPin ?? storedTab;
  const [openBasic, setOpenBasic] = usePanelOpen(
    "releva:panel:basic",
    focus === null || focus === "identity" || focus === "description" || focus === "cnae",
    focus === "identity" || focus === "description" || focus === "cnae",
  );
  const [openIncome, setOpenIncome] = usePanelOpen("releva:panel:income", focus === "income", focus === "income");
  const [openBalance, setOpenBalance] = usePanelOpen("releva:panel:balance", focus === "balance", focus === "balance");
  const [openStructure, setOpenStructure] = usePanelOpen(
    "releva:panel:structure",
    focus === "structure",
    focus === "structure",
  );
  const [openDeal, setOpenDeal] = usePanelOpen(
    "releva:panel:deal",
    focus === null || focus === "price",
    focus === "price",
  );

  const [closedAfterSave, setClosedAfterSave] = useState("");
  const [setupOpen, setSetupOpen] = useState(promptSetup);
  const [saveTarget, setSaveTarget] = useState("");
  const [rejectedSave, setRejectedSave] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [suppressStatus, setSuppressStatus] = useState(false);
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
    address: initial.address,
    codename: initial.codename,
    region: initial.region,
    foundedYear: initial.foundedYear,
    description: initial.description,
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
    adjustedEbitda,
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
    adjustedEbitda !== baseline.adjustedEbitda ||
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

    const blocked = [capitalPercents, productPercents, clientPercents].some((values) => slicePercentIssue(values) !== "ok");

    if (!blocked) {
      setRejectedSave("");
      setSuppressStatus(false);
      return;
    }

    event.preventDefault();
    leaveHrefRef.current = null;
    setRejectedSave(id);
    setSuppressStatus(true);
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

  function applyAccounts(result: Extract<AnnualAccountsState, { ok: true }>) {
    if (result.revenue.length > 0) {
      setRevenue(result.revenue);
    }

    if (result.ebitda.length > 0) {
      setEbitda(result.ebitda);
    }

    setSaveClosed("");
    setOpenIncome(true);

    if (result.statements.some((statement) => Object.keys(statement.balance).length > 0)) {
      setSaveClosed("");
      setOpenBalance(true);
    }

    setClosedYears((current) => {
      const next: CompanyDraftInput["closedYears"] = [{ ...current[0] }, { ...current[1] }, { ...current[2] }];
      const used = new Set<number>();

      for (const statement of result.statements) {
        const yearText = String(statement.year);
        let index = next.findIndex((year, item) => !used.has(item) && year.year === yearText);

        if (index < 0) {
          index = next.findIndex((year, item) => !used.has(item) && year.sales.trim() === "");
        }

        if (index < 0) {
          index = next.findIndex((_, item) => !used.has(item));
        }

        if (index !== 0 && index !== 1 && index !== 2) {
          continue;
        }

        used.add(index);
        const slot = { ...next[index], year: yearText };

        for (const key of pnlInputKeys) {
          const value = statement.pnl[key];

          if (value !== undefined) {
            slot[key] = value;
          }
        }

        for (const key of balanceInputKeys) {
          const value = statement.balance[key];

          if (value !== undefined) {
            slot[key] = value;
          }
        }

        next[index] = slot;
      }

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
  const ebitdaFromAccounts =
    ebitdaCentsFromAccounts !== null && ebitdaCentsFromAccounts >= 0 ? eurosToCentsLabel(ebitdaCentsFromAccounts) : null;
  const dealNote =
    accountYear && salesFromAccounts
      ? (ebitdaFromAccounts ? companyCopy.dealReflectsBoth : companyCopy.dealReflectsSales).replace("{year}", accountYear.year)
      : companyCopy.euroHint;
  const investorPreview = draftInvestorPreview({
    legalName,
    address,
    codename,
    region,
    foundedYear,
    description,
    principalCnae,
    secondaryCnaes,
    revenue: salesFromAccounts ?? revenue,
    ebitda: ebitdaFromAccounts ?? ebitda,
    adjustedEbitda,
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
  const statusMessage =
    state && !state.saved && !suppressStatus && !percentSumMessages.has(state.message) ? state.message : null;
  const formDirty = basicDirty || structureDirty || incomeDirty || balanceDirty || dealDirty;

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
    {setupOpen ? (
      <CompanySetup
        cif={cif}
        onApply={applyAccounts}
        onClose={() => {
          setSetupOpen(false);
        }}
      />
    ) : null}
    <form ref={formRef} action={action} onSubmit={onSubmit} className="flex flex-col gap-4">
      <UnsavedChangesGuard dirty={formDirty} onSave={saveAndLeave} />
      <h1 className="text-3xl tracking-tight text-public-ink">{sellerCopy.detailsTitle}</h1>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <SellerTabs
          label={companyCopy.tabsLabel}
          tabs={[
            { id: "company", label: companyCopy.detailsCompanyTab },
            { id: "deal", label: companyCopy.detailsDealTab },
          ]}
          value={tab}
          onChange={setTab}
        />
        <AccountsUpload onApply={applyAccounts} compact />
      </div>
      <div className={tab === "company" ? "flex flex-col gap-4" : "hidden"}>
      <Panel
        title={companyCopy.basicTitle}
        open={saveClosed === "basic" ? false : openBasic}
        dirty={basicDirty}
        done={legalName.trim().length > 0}
        onEdit={() => {
          setSaveClosed("");
          setOpenBasic(true);
        }}
        onCollapse={() => setOpenBasic(false)}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Fact id="panel-identity" icon={Building2} label={companyCopy.factName}>
            <input
              name="legalName"
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              className={fieldClassName}
            />
          </Fact>
          <Fact icon={FileSpreadsheet} label={companyCopy.factNif}>
            <input
              name="cif"
              value={nif}
              spellCheck={false}
              autoCapitalize="characters"
              onChange={(event) => setNif(event.target.value.toUpperCase())}
              className={fieldClassName}
            />
          </Fact>
          <Fact icon={MapPin} label={companyCopy.addressLabel}>
            <input
              name="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className={fieldClassName}
            />
          </Fact>
          <Fact icon={CalendarDays} label={companyCopy.foundedYearLabel}>
            <input
              name="foundedYear"
              inputMode="numeric"
              value={foundedYear}
              onChange={(event) => setFoundedYear(keepYear(event.target.value))}
              className={fieldClassName}
            />
          </Fact>
          <Fact icon={Map} label={companyCopy.regionLabel}>
            <input
              name="region"
              required
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className={fieldClassName}
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
          <span className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
            {companyCopy.descriptionLabel}
            <FieldHint text={companyCopy.descriptionGuide} />
          </span>
          <textarea
            name="description"
            rows={4}
            maxLength={descriptionMaxLength}
            placeholder={`${companyCopy.descriptionPlaceholder} (máx. ${descriptionMaxLength} caracteres)`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-xl border border-[#e7eaee] bg-white px-3 py-2 text-base outline-none focus-visible:border-[#465ab4]"
            aria-label={companyCopy.descriptionLabel}
          />
          <span className="flex items-start justify-between gap-4 text-sm text-[#667085]">
            {description.length > 80 ? <span className="text-[#9a6b12]">{companyCopy.descriptionProgress}</span> : <span />}
            <span>
              {description.length} / {descriptionMaxLength}
            </span>
          </span>
        </div>
        <div id="panel-cnae" className="grid scroll-mt-6 gap-4 md:grid-cols-2">
          <CnaeSelect name="principalCnae" label={companyCopy.principalCnaeLabel} value={principalCnae} onChange={setPrincipalCnae} />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              {companyCopy.secondaryCnaeLabel} (máximo {maxSecondaryCnaes})
            </p>
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
            <Button
              type="button"
              variant="outline"
              disabled={secondaryCnaes.length >= maxSecondaryCnaes}
              onClick={() => {
                setSecondaryCnaes((current) => [...current, ""]);
              }}
            >
              {companyCopy.addSecondaryCnae}
            </Button>
          </div>
        </div>
        <SaveButton id="basic" pending={pending} pendingId={saveTarget} rejected={panelRejected("basic")} shake={attempt} dirty={basicDirty} onChoose={chooseSave} />
      </Panel>

      <Panel
        id="panel-structure"
        title={companyCopy.structureHeading}
        intro={companyCopy.structureFold}
        hint={companyCopy.slicePrivate}
        open={saveClosed === "structure" ? false : openStructure}
        dirty={structureDirty}
        done={headcount.length > 0 || capitalPercents.some((value) => value.trim().length > 0)}
        onEdit={() => {
          setSaveClosed("");
          setOpenStructure(true);
        }}
        onCollapse={() => setOpenStructure(false)}
      >
        <CustomerChoice customerBase={customerBase} onCustomerBase={setCustomerBase} />
        {customerBase === "business" || customerBase === "mixed"
          ? null
          : clientPercents.map((value, index) => (
              <input key={`kept-client-${index}`} type="hidden" name="clientPercent" value={value} />
            ))}
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <PercentRows
            legend={companyCopy.shareholdersLegend}
            name="capitalPercent"
            kind="capital"
            addLabel={companyCopy.addShareholder}
            values={capitalPercents}
            onChange={setCapitalPercents}
          />
          <PercentRows
            legend={companyCopy.productsLegend}
            name="productPercent"
            kind="product"
            addLabel={companyCopy.addProduct}
            values={productPercents}
            onChange={setProductPercents}
          />
          {customerBase === "business" || customerBase === "mixed" ? (
            <PercentRows
              legend={companyCopy.clientsLegend}
              name="clientPercent"
              kind="client"
              addLabel={companyCopy.addClient}
              values={clientPercents}
              onChange={setClientPercents}
            />
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>
        <SaveButton id="structure" pending={pending} pendingId={saveTarget} rejected={panelRejected("structure")} shake={attempt} dirty={structureDirty} onChoose={chooseSave} />
      </Panel>

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
        <div className="overflow-x-auto rounded-xl border border-[#e7eaee]">
          <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-sm">
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
        <SaveButton id="income" pending={pending} pendingId={saveTarget} rejected={panelRejected("income")} shake={attempt} dirty={incomeDirty} onChoose={chooseSave} />
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
        <div className="overflow-x-auto rounded-xl border border-[#e7eaee]">
          <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
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
        <SaveButton id="balance" pending={pending} pendingId={saveTarget} rejected={panelRejected("balance")} shake={attempt} dirty={balanceDirty} onChoose={chooseSave} />
      </Panel>
      </div>

      <div className={tab === "deal" ? "flex flex-col gap-4" : "hidden"}>
      {reviewPending ? (
        <p className="rounded-2xl bg-[#fff8db] px-4 py-3 text-sm font-medium text-[#614d05]">{billingCopy.reviewPending}</p>
      ) : null}
      <Panel
        id="panel-price"
        title={companyCopy.detailsDealTab}
        intro={companyCopy.dealFold}
        hint={dealNote}
        open={saveClosed === "deal" ? false : openDeal}
        dirty={dealDirty}
        done={askingPrice.trim().length > 0}
        onEdit={() => {
          setSaveClosed("");
          setOpenDeal(true);
        }}
        onCollapse={() => setOpenDeal(false)}
      >
        <PublicFicha
          codename={codename}
          onCodename={setCodename}
          region={region}
          revenue={salesFromAccounts ?? revenue}
          ebitda={ebitdaFromAccounts ?? ebitda}
          adjustedEbitda={adjustedEbitda}
          askingPrice={askingPrice}
        >
          <FichaMetrics
            revenue={salesFromAccounts ?? revenue}
            revenueLocked={salesFromAccounts !== null}
            onRevenue={setRevenue}
            opex={opex}
            onOpex={setOpex}
            askingPrice={askingPrice}
            onAskingPrice={setAskingPrice}
            ebitda={ebitdaFromAccounts ?? ebitda}
            ebitdaLocked={ebitdaFromAccounts !== null}
            onEbitda={setEbitda}
            adjustedEbitda={adjustedEbitda}
            onAdjustedEbitda={setAdjustedEbitda}
            margin={marginText(salesFromAccounts ?? revenue, ebitdaFromAccounts ?? ebitda)}
          />
        </PublicFicha>
        <div className="mt-8 flex flex-col gap-4">
          <span className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
            {companyCopy.openFichaTitle}
            <FieldHint text={companyCopy.openFichaHint} />
          </span>
          <CompanyBanner
            heading="p"
            title={investorPreview.codename.trim().length > 0 ? investorPreview.codename : companyCopy.codenameLabel}
            subtitle={investorPreview.region.trim().length > 0 ? investorPreview.region : companyCopy.regionLabel}
          />
          <CompanyProfile project={investorPreview} />
        </div>
        <SaveButton id="deal" pending={pending} pendingId={saveTarget} rejected={panelRejected("deal")} shake={attempt} dirty={dealDirty} onChoose={chooseSave} />
      </Panel>
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

const cardPhotoLimit = 4;
const cardPhotoBytes = 8 * 1024 * 1024;

function PublicFicha({
  codename,
  onCodename,
  region,
  revenue,
  ebitda,
  adjustedEbitda,
  askingPrice,
  children,
}: {
  codename: string;
  onCodename: (value: string) => void;
  region: string;
  revenue: string;
  ebitda: string;
  adjustedEbitda: string;
  askingPrice: string;
  children: ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const imageSrc = projectImageSrc(projectSlug(codename));
  const shown = photos[active] ?? imageSrc;

  function storePhotos(next: string[]) {
    setPhotos(next);
    setActive((current) => Math.min(current, Math.max(next.length - 1, 0)));
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

    storePhotos([...photos, ...next].slice(0, cardPhotoLimit));
  }

  return (
    <>
      <span className="flex items-center gap-2 border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">
        {companyCopy.fichaFieldsTitle}
      </span>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-[#2b3b4a]">
            <label htmlFor="project-codename">{companyCopy.codenameLabel}</label>
            <FieldHint text={companyCopy.codenameHint} />
          </span>
          <input
            id="project-codename"
            name="codename"
            required
            value={codename}
            onChange={(event) => onCodename(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-[#2b3b4a]">
            {companyCopy.cardPhotos}
            <FieldHint text={companyCopy.cardPhotosHint} />
          </span>
          <button
            type="button"
            onClick={() => {
              fileRef.current?.click();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#2b3b4a]"
          >
            <ImagePlus className="size-4" aria-hidden />
            {companyCopy.cardPhotos}
          </button>
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
          {photos.length > 0 ? (
            <ul className="grid grid-cols-4 gap-2">
              {photos.map((photo, index) => (
                <li key={`${index}-${photo.slice(-24)}`} className="relative">
                  <button
                    type="button"
                    aria-pressed={index === active}
                    onClick={() => setActive(index)}
                    className={
                      index === active
                        ? "aspect-square w-full overflow-hidden rounded-xl border-2 border-[#465ab4]"
                        : "aspect-square w-full overflow-hidden rounded-xl border border-[#e7eaee]"
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="" className="size-full object-cover" />
                  </button>
                  <button
                    type="button"
                    aria-label={companyCopy.cardPhotosRemove}
                    onClick={() => {
                      storePhotos(photos.filter((_, itemIndex) => itemIndex !== index));
                    }}
                    className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#c0362c] text-white"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
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
        shown={shown}
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
  shown,
}: {
  codename: string;
  region: string;
  revenue: string;
  ebitda: string;
  adjustedEbitda: string;
  askingPrice: string;
  shown: string | null;
}) {
  const figures = [
    { label: companyCopy.revenueLabel, value: previewAmount(revenue) },
    { label: companyCopy.ebitdaLabel, value: previewAmount(ebitda) },
    { label: companyCopy.adjustedEbitdaLabel, value: previewAmount(adjustedEbitda) },
    { label: companyCopy.askingPriceLabel, value: previewAmount(askingPrice) },
  ];

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
          <SampleListing />
          <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)]">
            <div className={projectPhotoFrame}>
              {shown && shown.startsWith("data:") ? (
                // User-chosen bytes stay in this preview. next/image does not accept a data URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shown} alt="" className="absolute inset-0 size-full object-cover" />
              ) : shown ? (
                <Image src={shown} alt="" fill sizes="320px" className="object-cover" />
              ) : (
                <ProjectPhotoMark />
              )}
              <span className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-white text-[#5c6b78]">
                <Heart className="size-4" aria-hidden />
              </span>
              <PhotoScrim
                title={codename.trim().length > 0 ? codename : companyCopy.codenameLabel}
                place={region.trim().length > 0 ? region : companyCopy.regionLabel}
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <MarketCardFigures
                revenue={figures[0]?.value ?? "—"}
                ebitda={figures[1]?.value ?? "—"}
                adjustedEbitda={figures[2]?.value ?? "—"}
                askingPrice={figures[3]?.value ?? "—"}
                askingPriceCents={previewCents(askingPrice)}
                ebitdaCents={previewCents(ebitda)}
              />
            </div>
          </article>
          <SampleListing />
        </div>
      </div>
    </div>
  );
}

function SampleListing() {
  return (
    <article aria-hidden className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
      <div className={projectPhotoFrame}>
        <div className="absolute inset-x-4 bottom-4 flex animate-pulse flex-col gap-2">
          <div className="h-4 w-2/3 rounded bg-white/25" />
          <div className="h-3 w-1/3 rounded bg-white/15" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-16 animate-pulse rounded-xl bg-[#f4f6fb]" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 animate-pulse rounded-lg bg-[#f4f6fb]" />
          <div className="h-12 animate-pulse rounded-lg bg-[#f4f6fb]" />
          <div className="h-12 animate-pulse rounded-lg bg-[#f4f6fb]" />
        </div>
      </div>
    </article>
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

  return previewEuro(optionalEurosToCents(trimmed) ?? 0);
}

function previewEuro(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const whole = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const body = fraction === 0 ? grouped : `${grouped},${String(fraction).padStart(2, "0")}`;
  return `${negative ? "-" : ""}${body} €`;
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
