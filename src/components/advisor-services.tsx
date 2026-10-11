"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CircleCheck, Clock, MapPin, Pencil, User } from "lucide-react";
import { saveCorporateAction, saveServicesAction } from "@/app/mis-servicios/actions";
import { AdvisorListingCard } from "@/components/advisor-listing-card";
import { AppToast } from "@/components/app-toast";
import { advisorCopy } from "@/lib/advisor-copy";
import { toPublicAdvisorCard } from "@/lib/advisor-directory";
import {
  advisorServiceIds,
  centsToEuroInput,
  type AdvisorProfileView,
  type AdvisorServiceId,
  type StoredService,
} from "@/lib/advisor-profile";
import { advisorSectorName, advisorSectors, type AdvisorSectorId } from "@/lib/advisor-sectors";
import { isValidSpanishCif } from "@/lib/spanish-cif";

type PanelId = "corporate" | "services" | "documents";

const fieldClass =
  "h-11 w-full rounded-[14px] border border-[#e7eaee] px-3 text-sm outline-none focus-visible:border-[#5c4de0]";

function PriceField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`flex items-center gap-2 text-xs ${disabled ? "text-[#8b95a7]" : "text-[#64748b]"}`}>
      {label}
      <span className="relative">
        <input
          inputMode="numeric"
          value={value}
          disabled={disabled}
          aria-label={label}
          onChange={(event) => {
            onChange(event.target.value.replace(/\D/g, ""));
          }}
          className="h-10 w-28 rounded-xl border border-[#e7eaee] pr-7 pl-3 text-sm text-[#1c2740] outline-none focus-visible:border-[#5c4de0] disabled:bg-[#f7f8fb] disabled:text-[#8b95a7]"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm" aria-hidden>
          €
        </span>
      </span>
    </label>
  );
}

function SectorMenu({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = [...advisorSectors].sort((left, right) => left.name.localeCompare(right.name, "es"));

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: MouseEvent) {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className={`${fieldClass} flex items-center justify-between gap-2 bg-white text-left`}
      >
        <span>{advisorCopy.sectorSearch}</span>
        <ChevronDown className="size-4 shrink-0 text-[#5c6b78]" aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={advisorCopy.sectors}
          aria-multiselectable="true"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#e6e9f0] bg-white py-1 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]"
        >
          {options.map((sector) => {
            const checked = selected.includes(sector.id);
            return (
              <li key={sector.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => {
                    onToggle(sector.id);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm font-normal text-[#2b3b4a] hover:bg-[#f5f6fa]"
                >
                  <span
                    className={
                      checked
                        ? "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded bg-[#465ab4] text-white"
                        : "mt-0.5 inline-flex size-4 shrink-0 rounded border border-[#c5ced8] bg-white"
                    }
                    aria-hidden
                  >
                    {checked ? <Check className="size-3" /> : null}
                  </span>
                  {sector.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
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
  closes?: { id: string; codename: string; closedLabel: string; services: string; clientLabel: string }[];
}) {
  const [profile, setProfile] = useState(initial);
  const [editing, setEditing] = useState<PanelId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [savedPulse, setSavedPulse] = useState(0);
  const [pending, setPending] = useState(false);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [nif, setNif] = useState(initial.nif);
  const [postalCode, setPostalCode] = useState(initial.postalCode);
  const [description, setDescription] = useState(initial.description);
  const [sectors, setSectors] = useState<string[]>(initial.sectors);
  const [selectedServices, setSelectedServices] = useState<AdvisorServiceId[]>(
    initial.services.map((service) => service.serviceType),
  );
  const [prices, setPrices] = useState(pricesFrom(initial.services));

  const nifMessage = nif.trim().length > 0 && !isValidSpanishCif(nif) ? advisorCopy.nifInvalid : null;
  const draftServices = selectedServices.map((serviceType) => ({
    serviceType,
    priceFromCents: Number(prices[serviceType].from || "0") * 100,
    priceToCents: Number(prices[serviceType].to || "0") * 100,
  }));
  const draftListing = toPublicAdvisorCard({
    userId: "preview",
    businessName: profile.businessName,
    nif: profile.nif,
    postalCode: profile.postalCode,
    description: profile.description,
    sectors: profile.sectors,
    services: draftServices,
    closedOperations: [],
  });
  const publicListing = draftListing
    ? {
        ...draftListing,
        cases: closes.map((close) => ({
          sector: close.clientLabel,
          closedOn: close.closedLabel,
          value: close.services,
        })),
      }
    : null;

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
    setMessage(null);
    setSavedNote(advisorCopy.servicesSaved);
    setSavedPulse((current) => current + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <AppToast message={savedNote} pulse={savedPulse} />
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
              <SectorMenu
                selected={sectors}
                onToggle={(id) => {
                  setSectors((current) => (current.includes(id) ? current.filter((sector) => sector !== id) : [...current, id]));
                }}
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

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <section className={`rounded-2xl border border-[#e7eaee] bg-white p-5 ${profile.corporateComplete ? "" : "opacity-60"}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.servicesPanelTitle}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.servicesPanelBody}</p>
          </div>
          <Chip done={profile.services.length > 0} editing={false} />
        </div>
        <ul className="mt-2 divide-y divide-[#eef0f3]">
          {advisorServiceIds.map((id) => {
            const checked = selectedServices.includes(id);
            return (
              <li key={id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <label className={`flex items-center gap-3 text-sm font-medium ${checked ? "text-[#2b3b4a]" : "text-[#8b95a7]"}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!profile.corporateComplete}
                    onChange={() => {
                      setSelectedServices((current) =>
                        checked ? current.filter((service) => service !== id) : [...current, id],
                      );
                    }}
                    className="size-4 accent-[#465ab4]"
                  />
                  {advisorCopy.serviceTypes[id]}
                </label>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <PriceField
                    label={advisorCopy.priceFrom}
                    value={prices[id].from}
                    disabled={!checked || !profile.corporateComplete}
                    onChange={(from) => {
                      setPrices((current) => ({ ...current, [id]: { ...current[id], from } }));
                    }}
                  />
                  <PriceField
                    label={advisorCopy.priceTo}
                    value={prices[id].to}
                    disabled={!checked || !profile.corporateComplete}
                    onChange={(to) => {
                      setPrices((current) => ({ ...current, [id]: { ...current[id], to } }));
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {message && editing !== "corporate" ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={pending || !profile.corporateComplete}
            onClick={() => {
              void saveServices();
            }}
            className="h-10 rounded-full bg-[#3d34b8] px-4 text-sm text-white disabled:opacity-50"
          >
            {advisorCopy.save}
          </button>
        </div>
      </section>
      <aside className="flex h-full flex-col rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.listingTitle}</h2>
        {publicListing ? (
          <div className="mt-4 flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl">
              <AdvisorListingCard advisor={publicListing} natural />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#64748b]">{advisorCopy.listingEmpty}</p>
        )}
      </aside>
      </div>

      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.dealsTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.dealsBody}</p>
        {closes.length === 0 ? (
          <p className="mt-4 text-sm text-[#64748b]">{advisorCopy.dealsEmpty}</p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {closes.map((close) => (
              <li key={close.id} className="overflow-hidden rounded-3xl border border-[#e7eaee] bg-white">
                <div className="bg-[#1c2740] px-5 pt-5 pb-6">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-white/55 uppercase">Cerrada</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">{close.codename}</h3>
                </div>
                <div className="flex flex-col gap-2 px-5 py-4">
                  <p className="text-sm font-medium text-[#1c2740]">{close.clientLabel}</p>
                  {close.services.length > 0 ? <p className="text-sm text-[#3d4a63]">{close.services}</p> : null}
                  <p className="text-sm text-[#64748b]">{close.closedLabel}</p>
                </div>
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
