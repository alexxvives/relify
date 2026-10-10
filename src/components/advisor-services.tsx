"use client";

import { useState } from "react";
import { CircleCheck, Clock, MapPin, Pencil, User } from "lucide-react";
import { saveCorporateAction, saveDealsAction, saveServicesAction } from "@/app/mis-servicios/actions";
import { AdvisorListingCard } from "@/components/advisor-listing-card";
import { advisorCopy } from "@/lib/advisor-copy";
import { toPublicAdvisorCard } from "@/lib/advisor-directory";
import {
  advisorServiceIds,
  centsToEuroInput,
  formatAdvisorEuros,
  type AdvisorProfileView,
  type AdvisorServiceId,
  type StoredOperation,
  type StoredService,
} from "@/lib/advisor-profile";
import { advisorSectorName, advisorSectors, type AdvisorSectorId } from "@/lib/advisor-sectors";
import { isValidSpanishCif } from "@/lib/spanish-cif";

type PanelId = "corporate" | "services" | "deals" | "documents";

type DealDraft = {
  name: string;
  closingDate: string;
  sectorId: string;
  revenue: string;
  ebitda: string;
  enterpriseValue: string;
};

const fieldClass =
  "h-11 w-full rounded-[14px] border border-[#e7eaee] px-3 text-sm outline-none focus-visible:border-[#5c4de0]";

function emptyDeal(): DealDraft {
  return { name: "", closingDate: "", sectorId: "", revenue: "", ebitda: "", enterpriseValue: "" };
}

function Chip({ done, editing }: { done: boolean; editing: boolean }) {
  const label = editing ? advisorCopy.editing : done ? advisorCopy.completed : advisorCopy.pending;
  const tone = editing
    ? "bg-[#eef2ff] text-[#3d34b8]"
    : done
      ? "bg-[#e8f6ee] text-[#17663a]"
      : "bg-[#fff4d6] text-[#8a6112]";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {done && !editing ? <CircleCheck className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
      {label}
    </span>
  );
}

function pricesFrom(services: StoredService[]): Record<AdvisorServiceId, { from: string; to: string }> {
  const blank = Object.fromEntries(advisorServiceIds.map((id) => [id, { from: "", to: "" }])) as Record<
    AdvisorServiceId,
    { from: string; to: string }
  >;

  for (const service of services) {
    blank[service.serviceType] = {
      from: centsToEuroInput(service.priceFromCents),
      to: centsToEuroInput(service.priceToCents),
    };
  }

  return blank;
}

function dealsFrom(operations: StoredOperation[]): DealDraft[] {
  if (operations.length === 0) {
    return [emptyDeal()];
  }

  return operations.map((operation) => ({
    name: operation.name,
    closingDate: operation.closingDate,
    sectorId: operation.sectorId,
    revenue: centsToEuroInput(operation.revenueCents),
    ebitda: centsToEuroInput(operation.ebitdaCents),
    enterpriseValue: centsToEuroInput(operation.enterpriseValueCents),
  }));
}

export function AdvisorServices({ initial }: { initial: AdvisorProfileView }) {
  const [profile, setProfile] = useState(initial);
  const [editing, setEditing] = useState<PanelId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [nif, setNif] = useState(initial.nif);
  const [postalCode, setPostalCode] = useState(initial.postalCode);
  const [description, setDescription] = useState(initial.description);
  const [sectors, setSectors] = useState<string[]>(initial.sectors);
  const [sectorQuery, setSectorQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<AdvisorServiceId[]>(
    initial.services.map((service) => service.serviceType),
  );
  const [prices, setPrices] = useState(pricesFrom(initial.services));
  const [hasDeals, setHasDeals] = useState(initial.dealsAnswered ? initial.operations.length > 0 : false);
  const [deals, setDeals] = useState<DealDraft[]>(dealsFrom(initial.operations));

  const nifMessage = nif.trim().length > 0 && !isValidSpanishCif(nif) ? advisorCopy.nifInvalid : null;
  const listing = toPublicAdvisorCard({
    userId: "preview",
    businessName: profile.businessName,
    nif: profile.nif,
    postalCode: profile.postalCode,
    description: profile.description,
    sectors: profile.sectors,
    services: profile.services,
    closedOperations: profile.operations,
  });
  const visibleSectors = advisorSectors.filter((sector) =>
    sector.name.toLocaleLowerCase("es-ES").includes(sectorQuery.trim().toLocaleLowerCase("es-ES")),
  );

  function open(panel: PanelId) {
    setMessage(null);
    setEditing(panel);
  }

  function close() {
    setMessage(null);
    setEditing(null);
  }

  async function saveCorporate() {
    setPending(true);
    const result = await saveCorporateAction({
      businessName,
      nif,
      postalCode,
      description,
      sectors,
    });
    setPending(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setProfile((current) => ({
      ...current,
      businessName: businessName.trim(),
      nif: nif.trim().toUpperCase(),
      postalCode,
      description: description.trim(),
      sectors: sectors.filter((id): id is AdvisorSectorId => advisorSectors.some((sector) => sector.id === id)),
      corporateComplete: true,
    }));
    close();
  }

  async function saveServices() {
    setPending(true);
    const result = await saveServicesAction(
      selectedServices.map((serviceType) => ({
        serviceType,
        priceFrom: prices[serviceType].from,
        priceTo: prices[serviceType].to,
      })),
    );
    setPending(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setProfile((current) => ({
      ...current,
      services: selectedServices.map((serviceType) => ({
        serviceType,
        priceFromCents: Number(prices[serviceType].from) * 100,
        priceToCents: Number(prices[serviceType].to) * 100,
      })),
    }));
    close();
  }

  async function saveDeals() {
    setPending(true);
    const result = await saveDealsAction({
      hasClosedOperations: hasDeals,
      operations: hasDeals ? deals : [],
    });
    setPending(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setProfile((current) => ({
      ...current,
      dealsAnswered: true,
      operations: hasDeals
        ? deals.map((deal) => ({
            name: deal.name.trim(),
            closingDate: deal.closingDate.trim(),
            sectorId: deal.sectorId as AdvisorSectorId,
            revenueCents: Number(deal.revenue) * 100,
            ebitdaCents: Number(deal.ebitda) * 100,
            enterpriseValueCents: Number(deal.enterpriseValue) * 100,
          }))
        : [],
    }));
    close();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.corporateTitle}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.confidential}</p>
          </div>
          <div className="flex items-center gap-2">
            <Chip done={profile.corporateComplete} editing={editing === "corporate"} />
            {editing === "corporate" ? null : (
              <button type="button" onClick={() => open("corporate")} className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] px-3 text-sm">
                <Pencil className="size-3.5" aria-hidden />
                {advisorCopy.edit}
              </button>
            )}
          </div>
        </div>
        {editing === "corporate" ? (
          <div className="mt-6 flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                {advisorCopy.businessName}
                <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className={fieldClass} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                {advisorCopy.nif}
                <input
                  value={nif}
                  onChange={(event) => setNif(event.target.value.toUpperCase())}
                  aria-invalid={nifMessage !== null}
                  className={fieldClass}
                />
                {nifMessage ? <span className="text-sm font-normal text-red-700">{nifMessage}</span> : null}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                {advisorCopy.postalCode}
                <input
                  inputMode="numeric"
                  maxLength={5}
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#3d34b8]">
              {advisorCopy.description}
              <textarea
                value={description}
                maxLength={1000}
                placeholder={advisorCopy.descriptionPlaceholder}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 rounded-[14px] border border-[#e7eaee] px-3 py-3 text-sm font-normal text-[#2b3b4a] outline-none focus-visible:border-[#5c4de0]"
              />
              <span className="text-right text-xs font-normal text-[#64748b]">{description.length} / 1000</span>
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium text-[#3d34b8]">
              {advisorCopy.sectors}
              <input
                value={sectorQuery}
                placeholder={advisorCopy.sectorSearch}
                onChange={(event) => setSectorQuery(event.target.value)}
                className={fieldClass}
              />
              {sectors.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {sectors.map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setSectors((current) => current.filter((sector) => sector !== id))}
                        className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#3d34b8]"
                      >
                        {advisorSectorName(id)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="max-h-48 overflow-y-auto rounded-[14px] border border-[#e7eaee]">
                {visibleSectors.map((sector) => {
                  const checked = sectors.includes(sector.id);
                  return (
                    <li key={sector.id}>
                      <label className="flex items-start gap-2 px-3 py-2 text-sm font-normal text-[#2b3b4a]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSectors((current) =>
                              checked ? current.filter((id) => id !== sector.id) : [...current, sector.id],
                            );
                          }}
                          className="mt-1 accent-[#5c4de0]"
                        />
                        {sector.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
            {message && editing === "corporate" ? <p className="text-sm text-red-700">{message}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} className="h-10 rounded-full border border-[#e7eaee] px-4 text-sm">
                {advisorCopy.cancel}
              </button>
              <button
                type="button"
                disabled={pending || nifMessage !== null}
                onClick={() => {
                  void saveCorporate();
                }}
                className="h-10 rounded-full bg-[#3d34b8] px-4 text-sm text-white disabled:opacity-50"
              >
                {advisorCopy.save}
              </button>
            </div>
          </div>
        ) : (
          <dl className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <User className="size-5 text-[#8aa0d8]" aria-hidden />
              <div>
                <dt className="text-sm text-[#64748b]">{advisorCopy.businessName}</dt>
                <dd className="font-semibold">{profile.businessName || "—"}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#8aa0d8]" aria-hidden>
                #
              </span>
              <div>
                <dt className="text-sm text-[#64748b]">{advisorCopy.nif}</dt>
                <dd className="font-semibold">{profile.nif || "—"}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-[#8aa0d8]" aria-hidden />
              <div>
                <dt className="text-sm text-[#64748b]">{advisorCopy.postalCode}</dt>
                <dd className="font-semibold">{profile.postalCode || "—"}</dd>
              </div>
            </div>
          </dl>
        )}
      </section>

      <section className={`rounded-2xl border border-[#e7eaee] bg-white p-5 ${profile.corporateComplete ? "" : "opacity-60"}`}>
        <PanelHeading
          title={advisorCopy.servicesPanelTitle}
          body={advisorCopy.servicesPanelBody}
          done={profile.services.length > 0}
          editing={editing === "services"}
          disabled={!profile.corporateComplete}
          onEdit={() => open("services")}
        />
        {editing === "services" ? (
          <div className="mt-6 flex flex-col gap-4">
            <ul className="grid gap-3 md:grid-cols-2">
              {advisorServiceIds.map((id) => {
                const checked = selectedServices.includes(id);
                return (
                  <li key={id}>
                    <label className="flex items-center gap-3 rounded-2xl border border-[#e7eaee] px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedServices((current) =>
                            checked ? current.filter((service) => service !== id) : [...current, id],
                          );
                        }}
                        className="accent-[#5c4de0]"
                      />
                      {advisorCopy.serviceTypes[id]}
                    </label>
                  </li>
                );
              })}
            </ul>
            {selectedServices.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold">{advisorCopy.priceTitle}</h3>
                <p className="text-sm text-[#64748b]">{advisorCopy.priceSubtitle}</p>
                {selectedServices.map((id) => (
                  <div key={id} className="rounded-2xl border border-[#e7eaee] p-4">
                    <p className="text-sm font-medium">{advisorCopy.serviceTypes[id]}</p>
                    <p className="text-xs text-[#64748b]">{advisorCopy.inEuros}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.priceFrom}
                        <input
                          inputMode="numeric"
                          value={prices[id].from}
                          onChange={(event) => {
                            const from = event.target.value.replace(/\D/g, "");
                            setPrices((current) => ({ ...current, [id]: { ...current[id], from } }));
                          }}
                          className={fieldClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.priceTo}
                        <input
                          inputMode="numeric"
                          value={prices[id].to}
                          onChange={(event) => {
                            const to = event.target.value.replace(/\D/g, "");
                            setPrices((current) => ({ ...current, [id]: { ...current[id], to } }));
                          }}
                          className={fieldClass}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {message && editing === "services" ? <p className="text-sm text-red-700">{message}</p> : null}
            <SaveRow pending={pending} onCancel={close} onSave={() => void saveServices()} />
          </div>
        ) : profile.services.length > 0 ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {profile.services.map((service) => (
              <li key={service.serviceType} className="rounded-2xl bg-[#f7f8fb] px-4 py-3">
                <p className="text-sm text-[#64748b]">{advisorCopy.serviceTypes[service.serviceType]}</p>
                <p className="font-semibold">
                  {formatAdvisorEuros(service.priceFromCents)} - {formatAdvisorEuros(service.priceToCents)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={`rounded-2xl border border-[#e7eaee] bg-white p-5 ${profile.corporateComplete ? "" : "opacity-60"}`}>
        <PanelHeading
          title={advisorCopy.dealsTitle}
          body={advisorCopy.dealsBody}
          done={profile.dealsAnswered}
          editing={editing === "deals"}
          disabled={!profile.corporateComplete}
          onEdit={() => open("deals")}
        />
        {editing === "deals" ? (
          <div className="mt-6 flex flex-col gap-4">
            <fieldset>
              <legend className="text-sm font-medium">{advisorCopy.dealsQuestion}</legend>
              <div className="mt-3 flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="has-deals" checked={hasDeals} onChange={() => setHasDeals(true)} />
                  {advisorCopy.dealsYes}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="has-deals"
                    checked={!hasDeals}
                    onChange={() => {
                      setHasDeals(false);
                      setDeals([emptyDeal()]);
                    }}
                  />
                  {advisorCopy.dealsNo}
                </label>
              </div>
            </fieldset>
            {hasDeals ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold">{advisorCopy.dealsListTitle}</h3>
                <p className="text-sm text-[#64748b]">{advisorCopy.dealsListBody}</p>
                {deals.map((deal, index) => (
                  <div key={index} className="rounded-2xl border border-[#e7eaee] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {advisorCopy.dealTitle} {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeals((current) => current.filter((_, item) => item !== index))}
                        className="text-sm text-[#64748b]"
                      >
                        {advisorCopy.remove}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.dealName}
                        <input
                          value={deal.name}
                          placeholder={advisorCopy.dealNamePlaceholder}
                          onChange={(event) => updateDeal(setDeals, index, { name: event.target.value })}
                          className={fieldClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.dealSector}
                        <select
                          value={deal.sectorId}
                          onChange={(event) => updateDeal(setDeals, index, { sectorId: event.target.value })}
                          className={fieldClass}
                        >
                          <option value="">{advisorCopy.dealSectorPlaceholder}</option>
                          {advisorSectors.map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.dealDate}
                        <input
                          value={deal.closingDate}
                          placeholder={advisorCopy.dealDatePlaceholder}
                          onChange={(event) => updateDeal(setDeals, index, { closingDate: event.target.value })}
                          className={fieldClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.dealRevenue}
                        <input
                          inputMode="numeric"
                          value={deal.revenue}
                          onChange={(event) => updateDeal(setDeals, index, { revenue: event.target.value.replace(/\D/g, "") })}
                          className={fieldClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.dealEbitda}
                        <input
                          inputMode="numeric"
                          value={deal.ebitda}
                          onChange={(event) => updateDeal(setDeals, index, { ebitda: event.target.value.replace(/\D/g, "") })}
                          className={fieldClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        {advisorCopy.dealValue}
                        <input
                          inputMode="numeric"
                          value={deal.enterpriseValue}
                          onChange={(event) =>
                            updateDeal(setDeals, index, { enterpriseValue: event.target.value.replace(/\D/g, "") })
                          }
                          className={fieldClass}
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setDeals((current) => [...current, emptyDeal()])} className="text-sm font-medium text-[#3d34b8]">
                  {advisorCopy.addDeal}
                </button>
              </div>
            ) : null}
            {message && editing === "deals" ? <p className="text-sm text-red-700">{message}</p> : null}
            <SaveRow pending={pending} onCancel={close} onSave={() => void saveDeals()} />
          </div>
        ) : profile.operations.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {profile.operations.map((operation) => (
              <li key={`${operation.name}-${operation.closingDate}`} className="text-sm">
                <span className="font-medium">{operation.name}</span>
                <span className="text-[#64748b]"> · {operation.closingDate}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={`rounded-2xl border border-[#e7eaee] bg-white p-5 ${profile.corporateComplete ? "" : "opacity-60"}`}>
        <PanelHeading
          title={advisorCopy.documentsTitle}
          body={advisorCopy.documentsBody}
          done={false}
          editing={editing === "documents"}
          disabled={!profile.corporateComplete}
          onEdit={() => open("documents")}
        />
        {editing === "documents" ? (
          <div className="mt-6">
            <p className="rounded-2xl border border-dashed border-[#e7eaee] px-4 py-10 text-center text-sm text-[#64748b]">
              {advisorCopy.documentsDrop}
            </p>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={close} className="h-10 rounded-full bg-[#3d34b8] px-4 text-sm text-white">
                {advisorCopy.close}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#64748b]">{advisorCopy.documentsEmpty}</p>
        )}
      </section>

      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.listingTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.listingBody}</p>
        {listing ? (
          <div className="mt-4 max-w-[36rem]">
            <AdvisorListingCard advisor={listing} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#64748b]">{advisorCopy.listingEmpty}</p>
        )}
      </section>
    </div>
  );
}

function PanelHeading({
  title,
  body,
  done,
  editing,
  disabled,
  onEdit,
}: {
  title: string;
  body: string;
  done: boolean;
  editing: boolean;
  disabled: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{title}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{body}</p>
      </div>
      <div className="flex items-center gap-2">
        <Chip done={done} editing={editing} />
        {editing ? null : (
          <button
            type="button"
            disabled={disabled}
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] px-3 text-sm disabled:cursor-not-allowed"
          >
            <Pencil className="size-3.5" aria-hidden />
            {advisorCopy.edit}
          </button>
        )}
      </div>
    </div>
  );
}

function SaveRow({ pending, onCancel, onSave }: { pending: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="h-10 rounded-full border border-[#e7eaee] px-4 text-sm">
        {advisorCopy.cancel}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className="h-10 rounded-full bg-[#3d34b8] px-4 text-sm text-white disabled:opacity-50"
      >
        {advisorCopy.save}
      </button>
    </div>
  );
}

function updateDeal(
  setDeals: (updater: (current: DealDraft[]) => DealDraft[]) => void,
  index: number,
  patch: Partial<DealDraft>,
) {
  setDeals((current) => current.map((deal, item) => (item === index ? { ...deal, ...patch } : deal)));
}
