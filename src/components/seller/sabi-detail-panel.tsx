"use client";

import { detailCard, detailCardHead } from "@/components/seller/detail-card";
import { optionalEurosToCents } from "@/lib/company-draft";
import { FinancialTable } from "@/components/seller/financial-table";

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
import type { SabiDetailForm } from "@/lib/server/sabi-detail";
import { Button as KitButton, Card } from "@/components/ui/form";

const inputClass =
  "h-10 w-full rounded-lg border border-[#d9dee5] bg-white px-3 text-sm text-[#2b3b4a] outline-none transition-colors focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 disabled:bg-[#f6f7f9]";

export const sabiDetailCopy = {
  title: "Datos registrales y detalle contable",
  intro: "Más detalle de tu empresa: datos legales, contacto, grupo y el desglose completo del balance y la cuenta de resultados.",
  fromSabi: "Rellenado desde SABI",
  notImported: "Aún no hemos cargado estos datos: puedes rellenarlos a mano o esperar a que los carguemos (24 h).",
  noYears: "Guarda primero los ejercicios en «Cuenta de resultados» para poder completar el desglose por año.",
  save: "Guardar datos registrales",
  saving: "Guardando…",
};

export function SabiDetailPanel({
  detail,
  readOnly = false,
  hide = [],
}: {
  detail: SabiDetailForm;
  readOnly?: boolean;
  /** t81: columns already shown above in the admin report with the same value (read-only copy only). */
  hide?: string[];
}) {
  const hidden = new Set(readOnly ? hide : []);
  const yearsAsc = [...detail.years].sort((left, right) => left.year - right.year);
  const cents = (column: string) => yearsAsc.map((year) => optionalEurosToCents((year.values as Record<string, string>)[column] ?? ""));
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
    // t73: the admin copy (readOnly, inside Detalle de cuentas) is a compact, collapsed block; the seller keeps the full card.
    <Card id="panel-sabi-detail" className={readOnly ? "scroll-mt-6 !p-4 shadow-none" : "scroll-mt-6"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {readOnly ? (
            <h3 className="text-sm font-semibold text-[#2b3b4a]">{sabiDetailCopy.title}</h3>
          ) : (
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sabiDetailCopy.title}</h2>
          )}
          <p className={readOnly ? "mt-0.5 text-xs text-[#64748b]" : "mt-1 max-w-3xl text-sm text-[#64748b]"}>{readOnly ? "Datos brutos del informe SABI (solo administración): legales, contacto, grupo y desglose contable por año." : sabiDetailCopy.intro}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {readOnly && detail.imported ? (
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
                .filter((field) => field.group === group && !hidden.has(field.column))
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
          (Object.keys(sabiYearDetailGroups) as SabiYearDetailGroup[]).map((group) =>
            readOnly ? (
              // t81: same grid as Detalle de cuentas (years oldest first, Tendencia, share of the last year).
              // t88: same card as Detalle de cuentas' tables (shared detailCard styles).
              <div key={group} className={detailCard}>
                <h3 className={detailCardHead}>{sabiYearDetailGroups[group]} · €</h3>
                <FinancialTable
                  grid
                  trend
                  title="Concepto"
                  years={yearsAsc.map((year) => ({ year: year.year, forecast: false }))}
                  rows={sabiYearDetailFields
                    .filter((field) => field.group === group && !hidden.has(field.column))
                    .map((field) => ({ key: field.column, label: field.label, emphasis: field.column.startsWith("total"), values: cents(field.column) }))
                    .filter((row) => row.values.some((value) => value !== null))}
                  shareBase={group === "results" ? { label: "ingresos", values: cents("operatingRevenueCents") } : { label: "activo", values: cents("totalAssetsCents") }}
                />
              </div>
            ) : (
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
                          {readOnly && year.source === "sabi" ? <span className="ml-1 text-xs font-normal text-[#0f766e]">SABI</span> : null}
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
            ),
          )
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
