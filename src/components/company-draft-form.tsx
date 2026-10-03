"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Building2, CalendarDays, CircleCheck, Clock, FileSpreadsheet, Info, MapPin, Pencil, X } from "lucide-react";
import { sellerCopy } from "@/lib/seller-copy";
import { shellCopy } from "@/lib/shell";
import { saveCompanyDraftAction, type CompanyDraftState } from "@/app/mi-empresa/actions";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { SellerTabs } from "@/components/seller-tabs";
import { cnaeClasses } from "@/lib/cnae-2009";
import { balanceLabels, companyCopy, incomeLabels } from "@/lib/company-copy";
import {
  closedFieldName,
  emptyCompanyDraft,
  eurosToCents,
  forecastFieldName,
  type ClosedYearInput,
  type CompanyDraftInput,
  type ForecastYearInput,
} from "@/lib/company-draft";
import {
  anonymousSliceLabel,
  balanceDisplayKeys,
  balanceValue,
  descriptionMaxLength,
  ebitdaMarginBasisPoints,
  formatBasisPoints,
  headcountLabels,
  headcountRanges,
  incomeDisplayKeys,
  incomeValue,
  isEmphasisRow,
  maxActivitySlices,
  maxSecondaryCnaes,
  type BalanceAmounts,
  type BalanceDisplayKey,
  type IncomeDisplayKey,
  type PnlAmounts,
  type SliceKind,
} from "@/lib/company-profile";

const fieldClassName =
  "h-11 rounded-[14px] border border-[#e7eaee] bg-white px-3 text-base text-[#2b3b4a] outline-none focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20";

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

function marginText(revenue: string, ebitda: string): string {
  if (!unsignedEuroPattern.test(revenue.trim()) || !unsignedEuroPattern.test(ebitda.trim())) {
    return companyCopy.unavailable;
  }

  const basisPoints = ebitdaMarginBasisPoints(eurosToCents(ebitda), eurosToCents(revenue));
  return basisPoints === null ? companyCopy.unavailable : formatBasisPoints(basisPoints);
}

function Panel({
  title,
  intro,
  open,
  done,
  onEdit,
  children,
}: {
  title: string;
  intro?: string;
  open: boolean;
  done: boolean;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{title}</h2>
          {open ? null : intro ? <p className="mt-1 text-sm text-[#64748b]">{intro}</p> : null}
        </div>
        {open ? (
          <span className="inline-flex h-7 items-center gap-1 rounded-md bg-[#eef2ff] px-2 text-sm font-semibold text-[#465ab4]">
            <Pencil className="size-4" aria-hidden />
            {companyCopy.editing}
          </span>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
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
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] bg-white px-3 text-sm"
            >
              <Pencil className="size-3.5" aria-hidden />
              {companyCopy.editPanel}
            </button>
          </div>
        )}
      </div>
      <div className={open ? "mt-4" : "hidden"}>{children}</div>
    </section>
  );
}

function saveButton(pending: boolean) {
  return (
    <div className="flex justify-end">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center rounded-[14px] bg-[#465ab4] px-4 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? companyCopy.saving : companyCopy.save}
      </button>
    </div>
  );
}

function CnaeSelect({
  name,
  label,
  value,
  onChange,
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <NativeSelect name={name} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{companyCopy.cnaeEmpty}</option>
        {cnaeClasses.map((item) => (
          <option key={item.code} value={item.code}>
            {item.code} — {item.title}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
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
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{legend}</legend>
      {values.map((value, index) => (
        <div key={`${kind}-${index}`} className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-2 text-sm">
            {anonymousSliceLabel(kind, index + 1)}
            <input
              name={name}
              value={value}
              onChange={(event) => {
                onChange(values.map((current, currentIndex) => (currentIndex === index ? event.target.value : current)));
              }}
              className={fieldClassName}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onChange(values.filter((_, currentIndex) => currentIndex !== index));
            }}
          >
            {companyCopy.removeRow}
          </Button>
        </div>
      ))}
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
    </fieldset>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef2ff] p-2.5 text-[#465ab4]">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-[#64748b]">{label}</span>
        <span className="block text-base font-semibold text-[#2b3b4a]">{children}</span>
      </span>
    </div>
  );
}

export function CompanyDraftForm({ draft, cif }: { draft: CompanyDraftInput | null; cif: string }) {
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
  const [headcount, setHeadcount] = useState(initial.headcount);
  const [closedYears, setClosedYears] = useState(initial.closedYears);
  const [forecastYear, setForecastYear] = useState(initial.forecastYear);
  const [tab, setTab] = useState<"company" | "deal">("company");
  const [openIncome, setOpenIncome] = useState(false);
  const [openBalance, setOpenBalance] = useState(false);
  const [openStructure, setOpenStructure] = useState(false);
  const [showPending, setShowPending] = useState(true);

  function closedIndex(index: number): 0 | 1 | 2 {
    if (index === 1) {
      return 1;
    }

    if (index === 2) {
      return 2;
    }

    return 0;
  }

  function updateClosed(index: 0 | 1 | 2, key: keyof ClosedYearInput, value: string) {
    setClosedYears((current) => {
      const next: CompanyDraftInput["closedYears"] = [current[0], current[1], current[2]];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function incomeCell(key: IncomeDisplayKey, year: ForecastYearInput, index: number | "forecast") {
    if (key === "grossMargin" || key === "ebitda" || key === "operatingResult") {
      const value = incomeValue(key, previewPnl(year));
      return <span>{value === null ? companyCopy.unavailable : eurosToCentsLabel(value)}</span>;
    }

    const fieldName = index === "forecast" ? forecastFieldName(key) : closedFieldName(closedIndex(index), key);
    return (
      <input
        name={fieldName}
        value={year[key]}
        onChange={(event) => {
          if (index === "forecast") {
            setForecastYear((current) => ({ ...current, [key]: event.target.value }));
            return;
          }
          updateClosed(closedIndex(index), key, event.target.value);
        }}
        className={`${fieldClassName} w-full min-w-28`}
      />
    );
  }

  const filledPanels = [
    legalName.trim().length > 0 && cif.length > 0,
    description.trim().length > 0,
    principalCnae.length > 0,
    closedYears.some((year) => year.sales.trim().length > 0),
    closedYears.some((year) => year.currentAssets.trim().length > 0 || year.equity.trim().length > 0),
    headcount.length > 0 || capitalPercents.some((value) => value.trim().length > 0),
    askingPrice.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <form action={action} className="flex flex-col gap-4">
      {filledPanels < 7 && showPending ? (
        <div className="flex items-center gap-2 rounded-2xl bg-[#fff8db] p-3 text-base text-[#614d05]">
          <Info className="size-4 shrink-0" aria-hidden />
          <p className="flex-1">{companyCopy.detailsPending}</p>
          <button
            type="button"
            aria-label={shellCopy.menuClose}
            onClick={() => {
              setShowPending(false);
            }}
            className="inline-flex size-8 items-center justify-center rounded-full"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] leading-none font-semibold tracking-tight text-[#2b3b4a]">{sellerCopy.detailsTitle}</h1>
        <p className="flex h-[54px] min-w-[280px] items-center justify-between gap-6 rounded-xl border border-[#e7eaee] bg-white px-4">
          <span>{companyCopy.detailsStatus}</span>
          <span className="text-lg font-semibold">
            {filledPanels}/7
          </span>
        </p>
      </div>
      <SellerTabs
        label={companyCopy.tabsLabel}
        tabs={[
          { id: "company", label: companyCopy.detailsCompanyTab },
          { id: "deal", label: companyCopy.detailsDealTab },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className={tab === "company" ? "flex flex-col gap-4" : "hidden"}>
      <Panel title={companyCopy.basicTitle} intro={companyCopy.basicIntro} open done={legalName.trim().length > 0} onEdit={() => undefined}>
        <p className="text-sm text-[#64748b]">{companyCopy.basicIntro}</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <Fact icon={Building2} label={companyCopy.factName}>
            <input
              name="legalName"
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              className="w-full bg-transparent font-semibold outline-none"
            />
          </Fact>
          <Fact icon={FileSpreadsheet} label={companyCopy.factNif}>
            {cif.length > 0 ? cif : companyCopy.unavailable}
          </Fact>
          <Fact icon={MapPin} label={companyCopy.addressLabel}>
            <input
              name="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full bg-transparent font-semibold outline-none"
            />
          </Fact>
          <Fact icon={CalendarDays} label={companyCopy.foundedYearLabel}>
            <input
              name="foundedYear"
              inputMode="numeric"
              value={foundedYear}
              onChange={(event) => setFoundedYear(event.target.value)}
              className="w-full bg-transparent font-semibold outline-none"
            />
          </Fact>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.codenameLabel}
            <input name="codename" required value={codename} onChange={(event) => setCodename(event.target.value)} className={fieldClassName} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.regionLabel}
            <input name="region" required value={region} onChange={(event) => setRegion(event.target.value)} className={fieldClassName} />
          </label>
        </div>
        <label className="mt-6 flex flex-col gap-2">
          <span className="border-b border-[#465ab4] pb-2 text-base font-semibold text-[#465ab4]">{companyCopy.descriptionLabel}</span>
          <span className="text-sm leading-6 text-[#64748b]">{companyCopy.descriptionGuide}</span>
          <textarea
            name="description"
            rows={4}
            maxLength={descriptionMaxLength}
            placeholder={`${companyCopy.descriptionPlaceholder} (máx. ${descriptionMaxLength} caracteres)`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-xl border border-[#e7eaee] bg-white px-3 py-2 text-base outline-none focus-visible:border-[#465ab4]"
          />
          <span className="flex items-start justify-between gap-4 text-sm text-[#9a6b12]">
            <span>{description.length > 80 ? companyCopy.descriptionProgress : companyCopy.descriptionShort}</span>
            <span>
              {description.length} / {descriptionMaxLength}
            </span>
          </span>
        </label>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CnaeSelect name="principalCnae" label={companyCopy.principalCnaeLabel} value={principalCnae} onChange={setPrincipalCnae} />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              {companyCopy.secondaryCnaeLabel} (máximo {maxSecondaryCnaes})
            </p>
            {secondaryCnaes.map((code, index) => (
              <div key={`secondary-${index}`} className="flex items-end gap-2">
                <div className="flex-1">
                  <CnaeSelect
                    name="secondaryCnae"
                    label={`${companyCopy.secondaryCnaeLabel} ${index + 1}`}
                    value={code}
                    onChange={(value) => {
                      setSecondaryCnaes((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSecondaryCnaes((current) => current.filter((_, itemIndex) => itemIndex !== index));
                  }}
                >
                  {companyCopy.removeRow}
                </Button>
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
        <div className="mt-4">{saveButton(pending)}</div>
      </Panel>

      <Panel
        title={companyCopy.incomeHeading}
        intro={companyCopy.incomeFold}
        open={openIncome}
        done={closedYears.some((year) => year.sales.trim().length > 0)}
        onEdit={() => setOpenIncome(true)}
      >
        <p className="mb-3 text-sm text-[#667085]">{`${companyCopy.incomeIntro} ${companyCopy.signedEuroHint}`}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e6e9f0]">
                <th className="py-2 pr-3 text-left font-medium">{companyCopy.evolutionLabel}</th>
                {closedYears.map((year, index) => (
                  <th key={`closed-year-${index}`} className="px-2 py-2">
                    <input
                      name={closedFieldName(closedIndex(index), "year")}
                      value={year.year}
                      onChange={(event) => updateClosed(closedIndex(index), "year", event.target.value)}
                      aria-label={`Año cerrado ${index + 1}`}
                      className={fieldClassName}
                    />
                  </th>
                ))}
                <th className="px-2 py-2">
                  <span className="mb-1 block text-xs font-medium text-[#3d34b8]">{companyCopy.forecastMark}</span>
                  <input
                    name={forecastFieldName("year")}
                    value={forecastYear.year}
                    onChange={(event) => setForecastYear((current) => ({ ...current, year: event.target.value }))}
                    aria-label={companyCopy.forecastMark}
                    className={fieldClassName}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {incomeDisplayKeys.map((key) => (
                <tr key={key} className="border-b border-[#e6e9f0]">
                  <th className={isEmphasisRow(key) ? "py-2 pr-3 text-left font-semibold" : "py-2 pr-3 text-left font-medium"}>
                    {incomeLabels[key]}
                  </th>
                  {closedYears.map((year, index) => (
                    <td key={`${key}-${index}`} className="px-2 py-2">
                      {incomeCell(key, year, closedIndex(index))}
                    </td>
                  ))}
                  <td className="px-2 py-2">{incomeCell(key, forecastYear, "forecast")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">{saveButton(pending)}</div>
      </Panel>

      <Panel
        title={companyCopy.balanceHeading}
        intro={companyCopy.balanceFold}
        open={openBalance}
        done={closedYears.some((year) => year.currentAssets.trim().length > 0 || year.equity.trim().length > 0)}
        onEdit={() => setOpenBalance(true)}
      >
        <p className="mb-3 text-sm text-[#667085]">{companyCopy.balanceIntro}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e6e9f0]">
                <th className="py-2 pr-3 text-left font-medium">{companyCopy.evolutionLabel}</th>
                {closedYears.map((year, index) => (
                  <th key={`balance-year-${index}`} className="px-2 py-2 text-right font-medium">
                    {year.year || companyCopy.unavailable}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {balanceDisplayKeys.map((key) => (
                <tr key={key} className="border-b border-[#e6e9f0]">
                  <th className={isEmphasisRow(key) ? "py-2 pr-3 text-left font-semibold" : "py-2 pr-3 text-left font-medium"}>
                    {balanceLabels[key]}
                  </th>
                  {closedYears.map((year, index) => (
                    <td key={`${key}-${index}`} className="px-2 py-2">
                      <BalanceCell
                        rowKey={key}
                        year={year}
                        onChange={(value) => {
                          if (key === "totalAssets" || key === "totalLiabilities") {
                            return;
                          }
                          updateClosed(closedIndex(index), key, value);
                        }}
                        name={closedFieldName(closedIndex(index), key === "totalAssets" || key === "totalLiabilities" ? "year" : key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">{saveButton(pending)}</div>
      </Panel>

      <Panel
        title={companyCopy.structureHeading}
        intro={companyCopy.structureFold}
        open={openStructure}
        done={headcount.length > 0 || capitalPercents.some((value) => value.trim().length > 0)}
        onEdit={() => setOpenStructure(true)}
      >
        <p className="mb-3 text-sm text-[#667085]">{companyCopy.percentHint}</p>
        <div className="grid gap-6 lg:grid-cols-3">
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
          <PercentRows
            legend={companyCopy.clientsLegend}
            name="clientPercent"
            kind="client"
            addLabel={companyCopy.addClient}
            values={clientPercents}
            onChange={setClientPercents}
          />
        </div>
        <label className="mt-4 flex max-w-sm flex-col gap-2 text-sm font-medium">
          {companyCopy.headcountLabel}
          <NativeSelect name="headcount" value={headcount} onChange={(event) => setHeadcount(readHeadcount(event.target.value))}>
            <option value="">{companyCopy.headcountEmpty}</option>
            {headcountRanges.map((band) => (
              <option key={band} value={band}>
                {headcountLabels[band]}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="mt-4">{saveButton(pending)}</div>
      </Panel>
      </div>

      <div className={tab === "deal" ? "flex flex-col gap-4" : "hidden"}>
      <Panel
        title={companyCopy.detailsDealTab}
        intro={companyCopy.dealFold}
        open
        done={askingPrice.trim().length > 0}
        onEdit={() => undefined}
      >
        <p className="text-sm text-[#667085]">{companyCopy.euroHint}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.revenueLabel}
            <input name="revenue" value={revenue} onChange={(event) => setRevenue(event.target.value)} className={fieldClassName} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.ebitdaLabel}
            <input name="ebitda" value={ebitda} onChange={(event) => setEbitda(event.target.value)} className={fieldClassName} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.adjustedEbitdaLabel}
            <input
              name="adjustedEbitda"
              value={adjustedEbitda}
              onChange={(event) => setAdjustedEbitda(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <p className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.ebitdaMarginLabel}
            <span className="flex h-10 items-center text-base font-semibold">{marginText(revenue, ebitda)}</span>
          </p>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.opexLabel}
            <input name="opex" value={opex} onChange={(event) => setOpex(event.target.value)} className={fieldClassName} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {companyCopy.askingPriceLabel}
            <input
              name="askingPrice"
              value={askingPrice}
              onChange={(event) => setAskingPrice(event.target.value)}
              className={fieldClassName}
            />
          </label>
        </div>
        <div className="mt-4">{saveButton(pending)}</div>
      </Panel>
      </div>

      {state?.message ? (
        <p role={state.saved ? "status" : "alert"} className={state.saved ? "text-sm" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
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
    return <span>{value === null ? companyCopy.unavailable : eurosToCentsLabel(value)}</span>;
  }

  return (
    <input
      name={name}
      value={year[rowKey]}
      onChange={(event) => onChange(event.target.value)}
      className={`${fieldClassName} w-full min-w-28`}
    />
  );
}
