"use client";

import { useState } from "react";
import { CircleCheck, Clock, MapPin, Pencil, User } from "lucide-react";
import { saveCorporateAction, saveServicesAction } from "@/app/mis-servicios/actions";
import { AdvisorListingCard } from "@/components/advisor-listing-card";
import { advisorCopy } from "@/lib/advisor-copy";
import { casesForVerifiedCloses, toPublicAdvisorCard } from "@/lib/advisor-directory";
import {
  advisorServiceIds,
  centsToEuroInput,
  formatAdvisorEuros,
  type AdvisorProfileView,
  type AdvisorServiceId,
  type StoredService,
} from "@/lib/advisor-profile";
import { advisorSectorName, advisorSectors, type AdvisorSectorId } from "@/lib/advisor-sectors";
import { isValidSpanishCif } from "@/lib/spanish-cif";

type PanelId = "corporate" | "services" | "documents";

const fieldClass =
  "h-11 w-full rounded-[14px] border border-[#e7eaee] px-3 text-sm outline-none focus-visible:border-[#5c4de0]";

function EuroInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#2b3b4a]">
      {label}
      <span className="relative">
        <input
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            onChange(event.target.value.replace(/\D/g, ""));
          }}
          className={`${fieldClass} pr-8`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#64748b]" aria-hidden>
          €
        </span>
      </span>
    </label>
  );
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

export function AdvisorServices({
  initial,
  closes = [],
}: {
  initial: AdvisorProfileView;
  closes?: { id: string; codename: string; closedLabel: string }[];
}) {
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

  const nifMessage = nif.trim().length > 0 && !isValidSpanishCif(nif) ? advisorCopy.nifInvalid : null;
  const listing = toPublicAdvisorCard({
    userId: "preview",
    businessName: profile.businessName,
    nif: profile.nif,
    postalCode: profile.postalCode,
    description: profile.description,
    sectors: profile.sectors,
    services: profile.services,
    closedOperations: [],
  });
  const publicListing = listing ? { ...listing, cases: casesForVerifiedCloses(closes.length) } : null;
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

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
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
              <label className="flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
                {advisorCopy.businessName}
                <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className={fieldClass} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
                {advisorCopy.nif}
                <input
                  value={nif}
                  onChange={(event) => setNif(event.target.value.toUpperCase())}
                  aria-invalid={nifMessage !== null}
                  className={fieldClass}
                />
                {nifMessage ? <span className="text-sm font-normal text-red-700">{nifMessage}</span> : null}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
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
            <label className="relative flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
              {advisorCopy.description}
              <textarea
                value={description}
                maxLength={1000}
                placeholder={advisorCopy.descriptionPlaceholder}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 rounded-[14px] border border-[#e7eaee] px-3 py-3 pr-16 pb-7 text-sm font-normal text-[#2b3b4a] outline-none focus-visible:border-[#5c4de0]"
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-normal text-[#64748b]">
                {description.length} / 1000
              </span>
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
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
                <h3 className="text-base font-semibold text-[#2b3b4a]">{advisorCopy.priceTitle}</h3>
                <p className="text-sm text-[#64748b]">{advisorCopy.priceSubtitle}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedServices.map((id) => (
                    <div key={id} className="rounded-2xl border border-[#e7eaee] p-4">
                      <p className="text-sm font-medium text-[#2b3b4a]">{advisorCopy.serviceTypes[id]}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <EuroInput
                          label={advisorCopy.priceFrom}
                          value={prices[id].from}
                          onChange={(from) => {
                            setPrices((current) => ({ ...current, [id]: { ...current[id], from } }));
                          }}
                        />
                        <EuroInput
                          label={advisorCopy.priceTo}
                          value={prices[id].to}
                          onChange={(to) => {
                            setPrices((current) => ({ ...current, [id]: { ...current[id], to } }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
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

      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.dealsTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.dealsBody}</p>
        {closes.length === 0 ? (
          <p className="mt-4 text-sm text-[#64748b]">{advisorCopy.dealsEmpty}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {closes.map((close) => (
              <li key={close.id} className="rounded-2xl bg-[#f7f8fb] px-4 py-3">
                <p className="text-sm font-medium text-[#2b3b4a]">{close.codename}</p>
                <p className="text-sm text-[#64748b]">{close.closedLabel}</p>
              </li>
            ))}
          </ul>
        )}
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
        {publicListing ? (
          <div className="mt-4 max-w-[36rem]">
            <AdvisorListingCard advisor={publicListing} />
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
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
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
