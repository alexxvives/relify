"use client";

import { useEffect, useRef, useState } from "react";
import { AdvisorDocuments } from "@/components/advisor/advisor-documents";
import { ClosedDealsSlider } from "@/components/advisor/closed-deals-slider";
import { Check, ChevronDown, CircleCheck, Clock } from "lucide-react";
import { saveCorporateAction, saveMarketplaceAction } from "@/app/(app)/mis-servicios/actions";
import { AdvisorListingCard } from "@/components/advisor/advisor-listing-card";
import { useSavedToast } from "@/components/shell/use-saved-toast";
import { useDeepLinkMarker } from "@/components/shell/deep-link-marker";
import { InfoHint } from "@/components/ui/info-hint";
import { advisorCopy } from "@/lib/advisor-copy";
import { advisorPriceLabel, type PublicAdvisorCard } from "@/lib/advisor-directory";
import {
  advisorServiceIds,
  centsToEuroInput,
  type AdvisorProfileView,
  type AdvisorServiceId,
  type StoredService,
} from "@/lib/advisor-profile";
import { advisorSectorName, advisorSectorShort, advisorSectors, type AdvisorSectorId } from "@/lib/advisor-sectors";
import { isValidSpanishCif } from "@/lib/spanish-cif";
import type { AdvisorDocumentView } from "@/lib/advisor-documents";
import { Card, Input, Textarea } from "@/components/ui/form";


const fieldClass = "relify-field h-11 w-full px-3 text-sm";

function PriceField({
  label,
  value,
  disabled,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
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
          onBlur={onBlur}
          className="relify-field h-10 w-28 pr-7 pl-3 text-sm disabled:bg-[#f7f8fb] disabled:text-[#8b95a7]"
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
  const options = [...advisorSectors].sort((left, right) => left.short.localeCompare(right.short, "es"));

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
          className="absolute z-30 mt-1 max-h-[32rem] w-full overflow-auto rounded-xl border border-[#e6e9f0] bg-white py-1 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]"
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
                  <span title={sector.name}>{sector.short}</span>
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
  documents = [],
}: {
  initial: AdvisorProfileView;
  closes?: { id: string; codename: string; closedLabel: string; services: string; clientLabel: string; buyerLabel: string | null }[];
  documents?: AdvisorDocumentView[];
}) {
  const [profile, setProfile] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [messageFrom, setMessageFrom] = useState<"corporate" | "marketplace">("marketplace");
  const { notifySaved, savedToast } = useSavedToast();
  useDeepLinkMarker();
  const [nifError, setNifError] = useState(false);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [nif, setNif] = useState(initial.nif);
  const [postalCode, setPostalCode] = useState(initial.postalCode);
  const [description, setDescription] = useState(initial.description);
  const [sectors, setSectors] = useState<string[]>(initial.sectors);
  const [selectedServices, setSelectedServices] = useState<AdvisorServiceId[]>(
    initial.services.map((service) => service.serviceType),
  );
  const [prices, setPrices] = useState(pricesFrom(initial.services));

  // S40 (Alex): a field is checked when the advisor leaves it, never while typing.
  const nifMessage = nifError ? advisorCopy.nifInvalid : null;
  const draftServices = selectedServices.map((serviceType) => ({
    serviceType,
    priceFromCents: Number(prices[serviceType].from || "0") * 100,
    priceToCents: Number(prices[serviceType].to || "0") * 100,
  }));
  const previewListing: PublicAdvisorCard = {
    id: "preview",
    name: businessName.trim() || advisorCopy.previewName,
    verified: false,
    description: description.trim() || advisorCopy.previewDescription,
    sectors: sectors.length > 0 ? sectors.map((id) => advisorSectorShort(id)) : [advisorCopy.previewSector],
    services: draftServices
      .filter((service) => service.priceToCents > 0)
      .map((service) => ({
        title: advisorCopy.serviceTypes[service.serviceType],
        range: advisorPriceLabel(service.priceFromCents, service.priceToCents),
        fromCents: service.priceFromCents,
      })),
    cases: closes.map((close) => ({ sector: close.clientLabel, closedOn: close.closedLabel, value: close.services })),
  };

  // S40 (Alex): the three fields save when the advisor leaves one of them, once all three are valid; "Guardado" confirms.
  const corporateKey = `${businessName.trim()}|${nif.trim().toUpperCase()}|${postalCode}`;
  const savedCorporate = useRef(`${initial.businessName}|${initial.nif}|${initial.postalCode}`);
  const corporateReady = businessName.trim().length > 0 && isValidSpanishCif(nif) && /^\d{5}$/.test(postalCode);

  function saveCorporate() {
    if (!corporateReady || corporateKey === savedCorporate.current) {
      return;
    }
    const key = corporateKey;
    void saveCorporateAction({ businessName, nif, postalCode }).then((result) => {
      setMessageFrom("corporate");
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      savedCorporate.current = key;
      setMessage(null);
      notifySaved();
      setProfile((current) => ({
        ...current,
        businessName: businessName.trim(),
        nif: nif.trim().toUpperCase(),
        postalCode,
        corporateComplete: true,
      }));
    });
  }

  const marketKeyFor = (next: { description: string; sectors: string[]; services: AdvisorServiceId[] }) =>
    JSON.stringify([next.description.trim(), next.sectors, next.services.map((id) => [id, prices[id].from, prices[id].to])]);
  const savedMarket = useRef(
    marketKeyFor({ description: initial.description, sectors: initial.sectors, services: initial.services.map((service) => service.serviceType) }),
  );

  // S40 (Alex): Tu perfil en el marketplace saves itself (no Guardar): on leaving the description or a price, and on
  // every sector or service toggle. A service still missing a price waits quietly until both are filled.
  async function saveMarketplace(next: { sectors?: string[]; services?: AdvisorServiceId[] } = {}) {
    const nextSectors = next.sectors ?? sectors;
    const nextServices = next.services ?? selectedServices;
    const key = marketKeyFor({ description, sectors: nextSectors, services: nextServices });
    const incomplete = nextServices.some((id) => prices[id].from.length === 0 || prices[id].to.length === 0);
    if (incomplete || key === savedMarket.current) {
      return;
    }
    setMessageFrom("marketplace");
    const result = await saveMarketplaceAction({
      description,
      sectors: nextSectors,
      services: nextServices.map((serviceType) => ({
        serviceType,
        priceFrom: prices[serviceType].from,
        priceTo: prices[serviceType].to,
      })),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setProfile((current) => ({
      ...current,
      description: description.trim(),
      sectors: nextSectors.filter((id): id is AdvisorSectorId => advisorSectors.some((sector) => sector.id === id)),
      services: nextServices.map((serviceType) => ({
        serviceType,
        priceFromCents: Number(prices[serviceType].from) * 100,
        priceToCents: Number(prices[serviceType].to) * 100,
      })),
    }));
    savedMarket.current = key;
    setMessage(null);
    notifySaved();
  }

  return (
    <div className="flex flex-col gap-4">
      {savedToast}
      <div id="datos-corporativos" className="scroll-mt-24">
      <Card>
        {/* S37 (Alex): no Editar and no Guardar; the three fields autosave like the investor profile. */}
        <PanelHeading title={advisorCopy.corporateTitle} hint={advisorCopy.confidential} done={profile.corporateComplete} />
        <div className="mt-6 flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
                {advisorCopy.businessName}
                <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} onBlur={saveCorporate} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
                {advisorCopy.nif}
                <Input
                  value={nif}
                  onChange={(event) => {
                    setNif(event.target.value.toUpperCase());
                    setNifError(false);
                  }}
                  onBlur={() => {
                    setNifError(nif.trim().length > 0 && !isValidSpanishCif(nif));
                    saveCorporate();
                  }}
                  invalid={nifMessage !== null}
                  aria-describedby={nifMessage ? "advisor-nif-error" : undefined}
                />
                {nifMessage ? (
                  <span id="advisor-nif-error" className="text-xs font-normal text-[#b42318]">
                    {nifMessage}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
                {advisorCopy.postalCode}
                <Input
                  inputMode="numeric"
                  maxLength={5}
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                  onBlur={saveCorporate}
                />
              </label>
            </div>
            {message && messageFrom === "corporate" ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
        </div>
      </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.servicesPanelTitle}</h2>
          </div>
        </div>
        {/* S34/S40 (Alex): description, sectors and services are edited right here and save themselves. */}
        <div className="mt-5 flex flex-col gap-5">
            <label id="advisor-description" className="relative flex scroll-mt-24 flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
              <span data-field-title className="w-fit">{advisorCopy.description}</span>
              <Textarea
                value={description}
                maxLength={1000}
                placeholder={advisorCopy.descriptionPlaceholder}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => {
                  void saveMarketplace();
                }}
                className="min-h-28 pr-16 pb-7 text-sm font-normal"
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-normal text-[#64748b]">
                {description.length} / 1000
              </span>
            </label>
            <div id="advisor-sectors" className="flex scroll-mt-24 flex-col gap-2 text-sm font-medium text-[#2b3b4a]">
              <span data-field-title className="w-fit">{advisorCopy.sectors}</span>
              <SectorMenu
                selected={sectors}
                onToggle={(id) => {
                  const next = sectors.includes(id) ? sectors.filter((sector) => sector !== id) : [...sectors, id];
                  setSectors(next);
                  void saveMarketplace({ sectors: next });
                }}
              />
              {sectors.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {sectors.map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => {
                          const next = sectors.filter((sector) => sector !== id);
                          setSectors(next);
                          void saveMarketplace({ sectors: next });
                        }}
                        className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#3d34b8]"
                      >
                        <span title={advisorSectorName(id)}>{advisorSectorShort(id)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
        </div>
        <div id="advisor-services" className="scroll-mt-24">
        <h3 className="mt-5 text-base font-semibold text-[#2b3b4a]">
          <span data-field-title>{advisorCopy.servicesListTitle}</span>
        </h3>
        <ul className="mt-1 divide-y divide-[#eef0f3]">
          {advisorServiceIds.map((id) => {
            const checked = selectedServices.includes(id);
            return (
              <li key={id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <label className={`flex items-center gap-3 text-sm font-medium ${checked ? "text-[#2b3b4a]" : "text-[#8b95a7]"}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked ? selectedServices.filter((service) => service !== id) : [...selectedServices, id];
                      setSelectedServices(next);
                      void saveMarketplace({ services: next });
                    }}
                    className="size-4 accent-[#465ab4]"
                  />
                  {advisorCopy.serviceTypes[id]}
                </label>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <PriceField
                    label={advisorCopy.priceFrom}
                    value={prices[id].from}
                    disabled={!checked}
                    onChange={(from) => {
                      setPrices((current) => ({ ...current, [id]: { ...current[id], from } }));
                    }}
                    onBlur={() => {
                      void saveMarketplace();
                    }}
                  />
                  <PriceField
                    label={advisorCopy.priceTo}
                    value={prices[id].to}
                    disabled={!checked}
                    onChange={(to) => {
                      setPrices((current) => ({ ...current, [id]: { ...current[id], to } }));
                    }}
                    onBlur={() => {
                      void saveMarketplace();
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {message && messageFrom === "marketplace" ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
        </div>
      </section>
      {/* S35 (Alex): the preview follows the scroll on desktop; inline on phones. */}
      <aside className="flex flex-col rounded-2xl border border-[#e7eaee] bg-white p-5 xl:sticky xl:top-6">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.listingTitle}</h2>
        {/* S34: always the live card, with placeholders while a field is still empty. */}
        <div className="mt-4 w-full max-w-xl">
          <AdvisorListingCard advisor={previewListing} natural />
        </div>
      </aside>
      </div>

      <Card>
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.dealsTitle}</h2>
        {closes.length === 0 ? (
          <p className="mt-4 text-sm text-[#64748b]">{advisorCopy.dealsEmpty}</p>
        ) : (
          <ClosedDealsSlider closes={closes} />
        )}
      </Card>

      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5" data-advisor-documents>
        {/* S37 (Alex): no Editar; the same upload box as the seller's Mis documentos, files as same-size previews. */}
        <PanelHeading
          title={advisorCopy.documentsTitle}
          hint={advisorCopy.documentsInsurance}
          hintIcon="warning"
          done={documents.length > 0}
        />
        <AdvisorDocuments documents={documents} />
      </section>

    </div>
  );
}

/** S38 (Alex): no subtitles on Mis servicios; anything worth saying sits in the title's info bubble. */
function PanelHeading({
  title,
  hint,
  hintIcon = "info",
  done,
}: {
  title: string;
  hint: string;
  hintIcon?: "info" | "warning";
  done: boolean;
}) {
  return (
    // S35 (Alex): the status chip always sits at the far top-right.
    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
      <h2 className="flex min-w-0 flex-1 basis-[12rem] items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
        <span data-field-title>{title}</span>
        <InfoHint text={hint} icon={hintIcon} tone={hintIcon === "warning" ? "warning" : "ink"} />
      </h2>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Chip done={done} editing={false} />
      </div>
    </div>
  );
}
