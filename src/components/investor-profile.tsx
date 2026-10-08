"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Clock, FileSpreadsheet, MapPin, Pencil, User } from "lucide-react";
import { saveInvestorProfileAction } from "@/app/inversor/perfil/actions";
import { FieldHint } from "@/components/field-hint";
import { InvestorPublicCard } from "@/components/investor-public-card";
import { publicCardFromDraft, type DemoInvestorProfile, type InvestorProfileDraft } from "@/lib/demo-profile";
import { investorCopy, investorTypes } from "@/lib/investor-copy";
import { investorTicketBands } from "@/lib/investor-profile";
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

const fieldClass = "h-11 rounded-[14px] border border-[#e7eaee] px-3";

export function InvestorProfile({
  displayName,
  initial,
  draft,
  avatarUrl,
  publicOnly = false,
}: {
  displayName: string;
  initial: DemoInvestorProfile | null;
  draft: InvestorProfileDraft;
  avatarUrl: string;
  publicOnly?: boolean;
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
  const [thesis, setThesis] = useState(draft.thesis);
  const [contribution, setContribution] = useState(draft.contribution);
  const [state, action, pending] = useActionState(saveInvestorProfileAction, null);
  const professionalDone = tradeName.trim().length > 0 && nif.trim().length > 0 && postal.trim().length > 0;
  const publicDone = city.trim().length > 0 && investorType.length > 0 && thesis.trim().length > 0 && contribution.trim().length > 0;
  const drafted = publicCardFromDraft({
    photo: avatarUrl,
    city,
    province,
    investorType,
    ticket,
    sectors,
    thesis,
    contribution,
  });
  const preview = drafted ? { ...drafted, photo: avatarUrl } : null;

  const professional = publicOnly ? null : (
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
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
    <div className="flex flex-col gap-4">
      {professional}
      <form action={action} className="rounded-2xl border border-[#e7eaee] bg-white p-5">
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
        <div className="mt-5 grid items-start gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
        <input type="hidden" name="photo" value={draft.photo} />
        <div id="lugar" className="grid scroll-mt-8 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            {investorCopy.cityLabel}
            <input name="city" value={city} onChange={(event) => setCity(event.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            {investorCopy.provinceLabel}
            <input name="province" value={province} onChange={(event) => setProvince(event.target.value)} className={fieldClass} />
          </label>
        </div>
        <div id="tipo" className="mt-4 grid scroll-mt-8 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            {investorCopy.investorType}
            <select
              name="investorType"
              value={investorType}
              onChange={(event) => setInvestorType(event.target.value)}
              className={`${fieldClass} bg-white`}
            >
              <option value="">{investorCopy.investorTypeEmpty}</option>
              {investorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            {investorCopy.ticketLabel}
            <select name="ticket" value={ticket} onChange={(event) => setTicket(event.target.value)} className={`${fieldClass} bg-white`}>
              <option value="">{investorCopy.investorTypeEmpty}</option>
              {investorTicketBands.map((band) => (
                <option key={band} value={band}>
                  {band}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label id="busqueda" className="mt-4 flex scroll-mt-8 flex-col gap-2 text-sm">
          {investorCopy.sectorsLabel}
          <input name="sectors" value={sectors} onChange={(event) => setSectors(event.target.value)} className={fieldClass} />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm">
          {investorCopy.searchLabel}
          <textarea name="thesis" value={thesis} onChange={(event) => setThesis(event.target.value)} rows={4} className="rounded-xl border border-[#e7eaee] px-3 py-2" />
        </label>
        <label id="aporte" className="mt-4 flex scroll-mt-8 flex-col gap-2 text-sm">
          {investorCopy.contributionTitle}
          <FieldHint text={investorCopy.contributionHint} />
          <textarea
            name="contribution"
            value={contribution}
            onChange={(event) => setContribution(event.target.value)}
            rows={3}
            className="rounded-xl border border-[#e7eaee] px-3 py-2"
          />
        </label>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={pending} className="inline-flex h-10 items-center rounded-full bg-[#1c2740] px-4 text-sm font-medium text-white disabled:opacity-60">
            {pending ? investorCopy.savingProfile : investorCopy.saveProfile}
          </button>
          {state?.ok ? <p className="text-sm text-[#17663a]">{investorCopy.profileSaved}</p> : null}
          {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
        </div>
        </div>
        <div className="lg:col-span-1">
          <p className="mb-3 text-sm text-[#64748b]">{investorCopy.cardPreview}</p>
          <InvestorPublicCard label={investorCopy.cardPreviewName} profile={preview} />
        </div>
        </div>
      </form>
    </div>
  );
}
