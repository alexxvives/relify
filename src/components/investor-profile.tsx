"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, Clock, FileSpreadsheet, MapPin, Pencil, Upload, User, X } from "lucide-react";
import { saveInvestorPhotoAction, saveInvestorProfileLiveAction } from "@/app/inversor/perfil/actions";
import { AppToast } from "@/components/app-toast";
import { FieldHint } from "@/components/field-hint";
import { OptionSelect } from "@/components/ui/option-select";
import { InvestorPublicCard } from "@/components/investor-public-card";
import { publicCardFromDraft, type DemoInvestorProfile, type InvestorProfileDraft } from "@/lib/demo-profile";
import { cnaeSectionLabels } from "@/lib/cnae-section";
import { investorDisplayPhoto, uploadedInvestorPhoto } from "@/lib/gaze-avatar";
import { investorCopy, investorTypes } from "@/lib/investor-copy";
import {
  investorPhotoMaxBytes,
  investorPhotoMaxChars,
  investorProfileSchema,
  investorStakes,
  investorTicketBands,
} from "@/lib/investor-profile";
import { keepDigits } from "@/lib/numeric-input";

function Chip({ done }: { done: boolean }) {
  return (
    <span
      className={
        done
          ? "inline-flex items-center gap-1 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-xs font-medium text-[#17663a]"
          : "inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2.5 py-1 text-xs font-medium text-[#8a6112]"
      }
    >
      {done ? <CircleCheck className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
      {done ? investorCopy.doneChip : investorCopy.pendingChip}
    </span>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef2ff] text-[#465ab4]">
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block text-sm text-[#64748b]">{label}</span>
        <span className="block text-base font-semibold text-[#2b3b4a]">{value}</span>
      </span>
    </div>
  );
}

const fieldClass = "h-11 w-full rounded-xl border border-[#e7eaee] px-3";

export function InvestorProfile({
  displayName,
  initial,
  draft,
  avatarUrl,
  publicOnly = false,
  photoValue,
  onPhotoChange,
  hidePhotoControl = false,
}: {
  displayName: string;
  initial: DemoInvestorProfile | null;
  draft: InvestorProfileDraft;
  avatarUrl: string;
  publicOnly?: boolean;
  photoValue?: string;
  onPhotoChange?: (value: string) => void;
  hidePhotoControl?: boolean;
}) {
  const [editingProfessional, setEditingProfessional] = useState(false);
  const [tradeName, setTradeName] = useState(initial?.tradeName ?? displayName);
  const [nif, setNif] = useState(initial?.nif ?? "");
  const [postal, setPostal] = useState(initial?.postal ?? "");
  const [city, setCity] = useState(draft.city);
  const [province, setProvince] = useState(draft.province);
  const [investorType, setInvestorType] = useState(draft.investorType);
  const [ticket, setTicket] = useState(draft.ticket);
  const [sectors, setSectors] = useState(draft.sectors);
  const [photoState, setPhotoState] = useState(draft.photo);
  const photo = photoValue ?? photoState;
  const setPhoto = onPhotoChange ?? setPhotoState;
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [thesis, setThesis] = useState(draft.thesis);
  const [contribution, setContribution] = useState(draft.contribution);
  const [stake, setStake] = useState(draft.stake);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const professionalDone = tradeName.trim().length > 0 && nif.trim().length > 0 && postal.trim().length > 0;
  const publicDone = city.trim().length > 0 && investorType.length > 0 && thesis.trim().length > 0 && contribution.trim().length > 0 && stake.length > 0;
  const shownPhoto = investorDisplayPhoto(photo, avatarUrl);
  const savedPhoto = uploadedInvestorPhoto(photo);
  const lastSaved = useRef("");
  const drafted = publicCardFromDraft({
    photo,
    city,
    province,
    investorType,
    ticket,
    sectors,
    thesis,
    contribution,
    stake,
  });
  const preview = drafted ? { ...drafted, photo: shownPhoto } : null;
  const draftKey = JSON.stringify({
    photo: savedPhoto,
    city,
    province,
    investorType,
    ticket,
    sectors,
    thesis,
    contribution,
    stake,
  });

  useEffect(() => {
    if (lastSaved.current.length === 0) {
      lastSaved.current = draftKey;
      return;
    }

    if (lastSaved.current === draftKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      const parsed = investorProfileSchema.safeParse({
        photo: savedPhoto,
        city,
        province,
        investorType,
        ticket,
        sectors,
        thesis,
        contribution,
        stake,
      });

      if (!parsed.success) {
        return;
      }

      void saveInvestorProfileLiveAction(parsed.data).then((result) => {
        if (result?.ok) {
          lastSaved.current = draftKey;
          setSaveError(null);
          setSavedNote(investorCopy.profileSaved);
          return;
        }

        setSavedNote(null);
        setSaveError(result && !result.ok ? result.message : "No se ha podido guardar el perfil.");
      });
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [city, contribution, draftKey, investorType, province, savedPhoto, sectors, stake, thesis, ticket]);

  const professional = publicOnly ? null : (
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
            {investorCopy.professionalTitle}
            <FieldHint text={investorCopy.professionalHint} />
          </h2>
          <div className="flex items-center gap-2">
            <Chip done={professionalDone} />
            <button
              type="button"
              onClick={() => {
                setEditingProfessional((current) => !current);
              }}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] px-3 text-sm"
            >
              <Pencil className="size-3.5" aria-hidden />
              {editingProfessional ? investorCopy.save : investorCopy.edit}
            </button>
          </div>
        </div>
        {editingProfessional ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              {investorCopy.professionalName}
              <input value={tradeName} onChange={(event) => setTradeName(event.target.value)} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {investorCopy.professionalNif}
              <input value={nif} onChange={(event) => setNif(event.target.value)} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {investorCopy.professionalPostal}
              <input
                inputMode="numeric"
                maxLength={5}
                value={postal}
                onChange={(event) => setPostal(keepDigits(event.target.value, 5))}
                className={fieldClass}
              />
            </label>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Fact icon={User} label={investorCopy.professionalName} value={tradeName.trim().length > 0 ? tradeName : investorCopy.investorTypeEmpty} />
            <Fact icon={FileSpreadsheet} label={investorCopy.professionalNif} value={nif.trim().length > 0 ? nif : investorCopy.investorTypeEmpty} />
            <Fact icon={MapPin} label={investorCopy.professionalPostal} value={postal.trim().length > 0 ? postal : investorCopy.investorTypeEmpty} />
          </div>
        )}
      </section>
  );

  return (
    <div className="relative flex flex-col gap-4">
      <p aria-live="polite" className="pointer-events-none absolute -top-6 right-1 text-xs text-[#667085]">
        {savedNote ?? ""}
      </p>
      {professional}
      <AppToast message={saveError} tone="error" />
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
              {investorCopy.publicTitle}
              <FieldHint text={investorCopy.publicHint} />
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-[#64748b]">{investorCopy.publicHint}</p>
          </div>
          <Chip done={publicDone} />
        </div>
        <div className="mt-5 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,71fr)_minmax(0,29fr)]">
        <div className="min-w-0">
        <fieldset id="lugar" className="scroll-mt-8 border-0 p-0">
          <legend className="text-sm">{investorCopy.locationLabel}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              {investorCopy.cityLabel}
              <input value={city} onChange={(event) => setCity(event.target.value)} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {investorCopy.provinceLabel}
              <input value={province} onChange={(event) => setProvince(event.target.value)} className={fieldClass} />
            </label>
          </div>
        </fieldset>
        <div id="tipo" className="mt-4 grid scroll-mt-8 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2 text-sm">
            {investorCopy.investorType}
            <OptionSelect
              name="investorType"
              label={investorCopy.investorType}
              value={investorType}
              options={[{ value: "", label: investorCopy.investorTypeEmpty }, ...investorTypes.map((type) => ({ value: type, label: type }))]}
              onValueChange={setInvestorType}
            />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {investorCopy.ticketLabel}
            <OptionSelect
              name="ticket"
              label={investorCopy.ticketLabel}
              value={ticket}
              options={[{ value: "", label: investorCopy.investorTypeEmpty }, ...investorTicketBands.map((band) => ({ value: band, label: band }))]}
              onValueChange={setTicket}
            />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {investorCopy.stakeLabel}
            <OptionSelect
              name="stake"
              label={investorCopy.stakeLabel}
              value={stake}
              options={[{ value: "", label: investorCopy.investorTypeEmpty }, ...investorStakes.map((item) => ({ value: item, label: item }))]}
              onValueChange={setStake}
            />
          </div>
        </div>
        <div id="busqueda" className="mt-4 flex scroll-mt-8 flex-col gap-2 text-sm">
          {investorCopy.sectorsLabel}
          <SectorField value={sectors} onChange={setSectors} />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div id="aporte" className="flex scroll-mt-8 flex-col gap-2 text-sm">
          <span className="flex items-center gap-2">
            <label htmlFor="investor-contribution">{investorCopy.contributionTitle}</label>
            <FieldHint text={investorCopy.contributionHint} />
          </span>
          <textarea
            id="investor-contribution"
            value={contribution}
            onChange={(event) => setContribution(event.target.value)}
            rows={4}
            className="rounded-xl border border-[#e7eaee] px-3 py-2"
          />
        </div>
        <label className="flex flex-col gap-2 text-sm">
          {investorCopy.searchLabel}
          <textarea value={thesis} onChange={(event) => setThesis(event.target.value)} rows={4} className="rounded-xl border border-[#e7eaee] px-3 py-2" />
        </label>
        </div>
        </div>
        <div id="foto" className="min-w-0 scroll-mt-24 lg:sticky lg:top-6">
          {hidePhotoControl ? null : (
            <InvestorPhotoDrop
              photo={photo}
              fallback={avatarUrl}
              message={photoMessage}
              onReady={(next) => {
                setPhoto(next);
                setPhotoMessage(null);
              }}
              onHeavy={() => {
                setPhotoMessage(investorCopy.photoHeavy);
              }}
            />
          )}
          <div className={hidePhotoControl ? "" : "mt-4"}>
            <InvestorPublicCard label={displayName.trim().length > 0 ? displayName : investorCopy.cardPreviewName} profile={preview} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export function InvestorPhotoDrop({
  photo,
  fallback,
  message,
  onReady,
  onHeavy,
}: {
  photo: string;
  fallback: string;
  message: string | null;
  onReady: (value: string) => void;
  onHeavy: () => void;
}) {
  const [over, setOver] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const shown = investorDisplayPhoto(photo, fallback);
  const uploaded = uploadedInvestorPhoto(photo).length > 0;
  const note = message ?? saveMessage;

  function clearPhoto() {
    setSaveMessage(null);
    onReady("");
    void saveInvestorPhotoAction("").then((result) => {
      if (!result.ok) {
        setSaveMessage(investorCopy.photoFailed);
      }
    });
  }

  function take(file: File | undefined) {
    if (!file) {
      return;
    }

    setSaveMessage(null);
    readInvestorPhoto(
      file,
      (next) => {
        onReady(next);
        void saveInvestorPhotoAction(next).then((result) => {
          if (!result.ok) {
            setSaveMessage(investorCopy.photoFailed);
          }
        });
      },
      onHeavy,
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex w-28 flex-col items-center gap-1.5">
      <div className="relative size-28 shrink-0">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => {
          setOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files[0]);
        }}
        className={
          over
            ? "absolute inset-0 flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#465ab4] bg-[#eef2ff]"
            : "absolute inset-0 flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#c5d0f5] bg-[#f7f8ff]"
        }
      >
        {shown.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="size-full object-cover" />
        ) : (
          <User className="size-8 text-[#465ab4]" aria-hidden />
        )}
        <span className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-[#1c2740]/80 text-white">
          <Upload className="size-4" aria-hidden />
        </span>
        <input
          id="investor-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            take(file);
          }}
        />
      </label>
      {uploaded ? (
        <button
          type="button"
          aria-label={investorCopy.photoRemove}
          onClick={clearPhoto}
          className="absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full border border-white/80 bg-white text-[#1c2740] shadow-sm hover:text-[#c0362c]"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
      </div>
      <label htmlFor="investor-photo-input" className="cursor-pointer text-center text-[11px] leading-4">
        <span className="block font-medium text-[#1c2740]">{investorCopy.photoDrop}</span>
        <span className="block text-[#667085]">{investorCopy.photoDropHint}</span>
      </label>
      </div>
      {note ? <p className="text-sm text-[#c0362c]">{note}</p> : null}
    </div>
  );
}

function readInvestorPhoto(file: File, onReady: (value: string) => void, onHeavy: () => void) {
  if (!file.type.startsWith("image/") || file.size > investorPhotoMaxBytes) {
    onHeavy();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const value = typeof reader.result === "string" ? reader.result : "";

    if (value.length === 0 || value.length > investorPhotoMaxChars) {
      onHeavy();
      return;
    }

    onReady(value);
  };
  reader.readAsDataURL(file);
}

function sectorChips(value: string): string[] {
  return value
    .split(" · ")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function SectorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const chips = sectorChips(value);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const needle = query.trim().toLocaleLowerCase("es-ES");
  const choices = cnaeSectionLabels.filter(
    (label) => !chips.includes(label) && label.toLocaleLowerCase("es-ES").includes(needle),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function close(event: MouseEvent) {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  function write(next: string[]) {
    const joined = next.join(" · ");

    if (joined.length <= 160) {
      onChange(joined);
    }
  }

  function addCustom() {
    const next = custom.trim();

    if (next.length === 0 || chips.includes(next)) {
      setCustom("");
      return;
    }

    write([...chips, next]);
    setCustom("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <div className="relative">
      <input
        value={query}
        placeholder={investorCopy.sectorsSearch}
        onMouseDown={() => {
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        className={fieldClass}
      />
      {open ? (
        <ul className="absolute top-full z-30 mt-1 max-h-96 w-full overflow-auto rounded-xl border border-[#e7eaee] bg-white py-1 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]">
          <li className="border-b border-[#e7eaee] px-2 py-2">
            <input
              value={custom}
              placeholder={investorCopy.sectorsCustom}
              aria-label={investorCopy.sectorsCustom}
              onChange={(event) => {
                setCustom(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustom();
                }
              }}
              className="h-9 w-full rounded-lg border border-[#e7eaee] px-3 text-sm"
            />
          </li>
          {choices.map((label) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => {
                  write([...chips, label]);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex h-10 w-full items-center px-3 text-left text-sm hover:bg-[#f4f7ff]"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      </div>
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip}>
              <button
                type="button"
                onClick={() => {
                  write(chips.filter((item) => item !== chip));
                }}
                className="rounded-full bg-[#eef2ff] px-3 py-1 text-sm text-[#1c2740]"
              >
                {chip} ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
