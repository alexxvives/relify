"use client";

import { useState } from "react";
import { CircleCheck, Clock, FileSpreadsheet, MapPin, Pencil, User } from "lucide-react";
import { FieldHint } from "@/components/field-hint";
import type { DemoInvestorProfile } from "@/lib/demo-profile";
import { investorCopy, investorTypes } from "@/lib/investor-copy";
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

export function InvestorProfile({
  displayName,
  initial,
}: {
  displayName: string;
  initial: DemoInvestorProfile | null;
}) {
  const [editingProfessional, setEditingProfessional] = useState(false);
  const [editingThesis, setEditingThesis] = useState(false);
  const [editingTrajectory, setEditingTrajectory] = useState(false);
  const [tradeName, setTradeName] = useState(initial?.tradeName ?? displayName);
  const [nif, setNif] = useState(initial?.nif ?? "");
  const [postal, setPostal] = useState(initial?.postal ?? "");
  const [investorType, setInvestorType] = useState(initial?.investorType ?? "");
  const [trajectory, setTrajectory] = useState(initial?.trajectory ?? "");
  const professionalDone = tradeName.trim().length > 0 && nif.trim().length > 0 && postal.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
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
              <input value={tradeName} onChange={(event) => setTradeName(event.target.value)} className="h-11 rounded-[14px] border border-[#e7eaee] px-3" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {investorCopy.professionalNif}
              <input value={nif} onChange={(event) => setNif(event.target.value)} className="h-11 rounded-[14px] border border-[#e7eaee] px-3" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {investorCopy.professionalPostal}
              <input
                inputMode="numeric"
                maxLength={5}
                value={postal}
                onChange={(event) => setPostal(keepDigits(event.target.value, 5))}
                className="h-11 rounded-[14px] border border-[#e7eaee] px-3"
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
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
              {investorCopy.thesisTitle}
              <FieldHint text={investorCopy.thesisHint} />
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-[#64748b]">{investorCopy.thesisBody}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Chip done={investorType.length > 0} />
            <button
              type="button"
              onClick={() => {
                setEditingThesis((current) => !current);
              }}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] px-3 text-sm"
            >
              <Pencil className="size-3.5" aria-hidden />
              {editingThesis ? investorCopy.save : investorCopy.edit}
            </button>
          </div>
        </div>
        {editingThesis ? (
          <label className="mt-4 flex max-w-sm flex-col gap-2 text-sm">
            {investorCopy.investorType}
            <select
              value={investorType}
              onChange={(event) => setInvestorType(event.target.value)}
              className="h-11 rounded-[14px] border border-[#e7eaee] bg-white px-3"
            >
              <option value="">{investorCopy.investorTypeEmpty}</option>
              {investorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        ) : investorType.length > 0 ? (
          <p className="mt-4 inline-flex rounded-xl bg-[#f4f7ff] px-4 py-3 text-sm">
            <span>
              <span className="block text-[#64748b]">{investorCopy.investorType}</span>
              <span className="font-semibold text-[#465ab4]">{investorType}</span>
            </span>
          </p>
        ) : null}
      </section>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#2b3b4a]">
            {investorCopy.trajectoryTitle}
            <FieldHint text={investorCopy.trajectoryHint} />
          </h2>
          <div className="flex items-center gap-2">
            <Chip done={trajectory.trim().length > 0} />
            <button
              type="button"
              onClick={() => {
                setEditingTrajectory((current) => !current);
              }}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e7eaee] px-3 text-sm"
            >
              <Pencil className="size-3.5" aria-hidden />
              {editingTrajectory ? investorCopy.save : investorCopy.edit}
            </button>
          </div>
        </div>
        {editingTrajectory ? (
          <textarea
            value={trajectory}
            onChange={(event) => setTrajectory(event.target.value)}
            rows={4}
            className="mt-4 w-full rounded-xl border border-[#e7eaee] px-3 py-2"
          />
        ) : trajectory.trim().length > 0 ? (
          <p className="mt-4 text-sm leading-6 text-[#2b3b4a]">{trajectory}</p>
        ) : (
          <p className="mt-3 text-sm text-[#64748b]">{investorCopy.trajectoryBody}</p>
        )}
      </section>
    </div>
  );
}
