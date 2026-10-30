"use client";

import { useActionState, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";
import { saveSabiDetailAction, type SabiDetailState } from "@/app/(app)/mi-empresa/sabi-detail-actions";
import { Button } from "@/components/ui/button";
import {
  sabiCompanyDetailFields,
  sabiCompanyDetailGroups,
  sabiYearDetailFields,
  sabiYearDetailGroups,
  type SabiCompanyDetailGroup,
  type SabiYearDetailGroup,
} from "@/lib/sabi/detail-fields";
import { keepSignedEuro } from "@/lib/numeric-input";
import type { SabiDetailForm } from "@/server/sabiDetail";
import { Button as KitButton, Card } from "@/components/ui/form";

const inputClass =
  "h-10 w-full rounded-lg border border-[#d9dee5] bg-white px-3 text-sm text-[#2b3b4a] outline-none transition-colors focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 disabled:bg-[#f6f7f9]";

export const sabiDetailCopy = {
  title: "Datos registrales y detalle contable",
  intro: "Todo lo que trae el informe SABI que no cabe en las tablas de arriba: datos legales, contacto, grupo y el desglose completo del balance y la cuenta de resultados.",
  fromSabi: "Rellenado desde SABI",
  notImported: "Aún no se ha importado SABI: puedes rellenarlos a mano o esperar a que el equipo suba el informe.",
  noYears: "Guarda primero los ejercicios en «Cuenta de resultados» para poder completar el desglose por año.",
  save: "Guardar datos registrales",
  saving: "Guardando…",
};

export function SabiDetailPanel({ detail, readOnly = false }: { detail: SabiDetailForm; readOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SabiDetailState, FormData>(saveSabiDetailAction, null);
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(Object.entries(detail.company).map(([key, value]) => [`company_${key}`, value])),
    ...Object.fromEntries(detail.years.flatMap((year) => Object.entries(year.values).map(([key, value]) => [`year_${year.year}_${key}`, value]))),
  }));
  const [, startSave] = useTransition();
  // Rendered inside the ficha's own <form>: no nested form, the values are posted on their own.
  const save = () =>
    startSave(() => {
      const data = new FormData();

      for (const [name, value] of Object.entries(values)) {
        data.set(name, value);
      }

      action(data);
    });
  const set = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const filled = Object.values(values).filter((value) => value.trim() !== "").length;

  return (
    <Card id="panel-sabi-detail" className="scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sabiDetailCopy.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">{sabiDetailCopy.intro}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {detail.imported ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4f2] px-2.5 py-1 text-xs font-medium text-[#0f5f59]">
              <FileSpreadsheet className="size-3.5" aria-hidden />
              {sabiDetailCopy.fromSabi} · {filled}
            </span>
          ) : null}
          <KitButton type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} tone="outline" size="sm">
            {open ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
            {open ? "Plegar" : readOnly ? "Ver" : "Ver y editar"}
          </KitButton>
        </div>
      </div>

      <div className={open ? "mt-5 flex flex-col gap-6" : "hidden"}>
        {!detail.imported ? <p className="rounded-xl bg-[#f6f7f9] px-4 py-3 text-sm text-[#475467]">{sabiDetailCopy.notImported}</p> : null}

        {(Object.keys(sabiCompanyDetailGroups) as SabiCompanyDetailGroup[]).map((group) => (
          <fieldset key={group} className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold tracking-tight text-[#2b3b4a]">{sabiCompanyDetailGroups[group]}</legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sabiCompanyDetailFields
                .filter((field) => field.group === group)
                .map((field) => {
                  const name = `company_${field.column}`;
                  return (
                    <label key={field.column} className="flex flex-col gap-1.5 text-sm font-medium text-[#344054]">
                      {field.label}
                      <input
                        value={values[name] ?? ""}
                        disabled={readOnly}
                        type={field.kind === "date" ? "date" : "text"}
                        inputMode={field.kind === "money" || field.kind === "integer" ? "numeric" : undefined}
                        onChange={(event) =>
                          set(name, field.kind === "money" ? keepSignedEuro(event.target.value) : field.kind === "integer" ? event.target.value.replace(/\D/g, "") : event.target.value)
                        }
                        className={`${inputClass} ${field.kind === "money" || field.kind === "integer" ? "text-right tabular-nums" : ""}`}
                      />
                    </label>
                  );
                })}
            </div>
          </fieldset>
        ))}

        {detail.years.length === 0 ? (
          <p className="rounded-xl bg-[#f6f7f9] px-4 py-3 text-sm text-[#475467]">{sabiDetailCopy.noYears}</p>
        ) : (
          (Object.keys(sabiYearDetailGroups) as SabiYearDetailGroup[]).map((group) => (
            <fieldset key={group} className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold tracking-tight text-[#2b3b4a]">{sabiYearDetailGroups[group]} · €</legend>
              <div className="layout-table rounded-xl border border-[#e7eaee]">
                <table className="border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      <th className="sticky top-0 left-0 z-10 bg-[#f6f7f9] px-3 py-2.5 text-left font-medium text-[#2b3b4a]">Concepto</th>
                      {detail.years.map((year) => (
                        <th key={year.year} className="sticky top-0 bg-[#f6f7f9] px-3 py-2.5 text-right font-medium text-[#2b3b4a]">
                          {year.year}
                          {year.source === "sabi" ? <span className="ml-1 text-xs font-normal text-[#0f766e]">SABI</span> : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sabiYearDetailFields
                      .filter((field) => field.group === group)
                      .map((field, rowIndex) => (
                        <tr key={field.column}>
                          <th className={`sticky left-0 z-10 min-w-56 border-b border-[#eef0f3] px-3 py-2 text-left font-medium text-[#2b3b4a] ${rowIndex % 2 ? "bg-[#f8f9fb]" : "bg-white"}`}>
                            {field.label}
                          </th>
                          {detail.years.map((year) => {
                            const name = `year_${year.year}_${field.column}`;
                            return (
                              <td key={name} className={`border-b border-[#eef0f3] px-2 py-1.5 ${rowIndex % 2 ? "bg-[#f8f9fb]" : "bg-white"}`}>
                                <input
                                  value={values[name] ?? ""}
                                  disabled={readOnly}
                                  inputMode="decimal"
                                  aria-label={`${field.label} ${year.year}`}
                                  onChange={(event) => set(name, keepSignedEuro(event.target.value))}
                                  className={`${inputClass} min-w-32 text-right tabular-nums`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </fieldset>
          ))
        )}

        {readOnly ? null : (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {state ? (
              <p role="status" className={`text-sm ${state.saved ? "text-[#17663a]" : "text-[#c0362c]"}`}>
                {state.message}
              </p>
            ) : null}
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? sabiDetailCopy.saving : sabiDetailCopy.save}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
