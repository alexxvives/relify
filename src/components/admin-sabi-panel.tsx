"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";
import { confirmSabiAction, previewSabiAction } from "@/app/(app)/admin/empresas/[slug]/sabi-actions";
import type { SabiPreview } from "@/server/sabiImport";
import type { AdminSabiHolding, AdminSabiView } from "@/server/getAdminCompany";

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const schemeLabels: Record<string, string> = {
  cnae2025: "CNAE 2025",
  nace: "NACE Rev. 2",
  cae: "CAE",
  ussic: "US SIC",
  iae: "IAE",
  naics: "NAICS",
};

function money(cents: number | null): string {
  return cents === null ? "—" : euro.format(cents / 100);
}

function isoDay(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function AdminSabiPanel({ sabi }: { sabi: AdminSabiView }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SabiPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function form(chosen: File): FormData {
    const data = new FormData();
    data.set("projectId", sabi.projectId);
    data.set("file", chosen);
    return data;
  }

  function choose(chosen: File | null) {
    setFile(chosen);
    setPreview(null);
    setError(null);
    setDone(null);

    if (!chosen) {
      return;
    }

    start(async () => {
      const result = await previewSabiAction(form(chosen));

      if (result.ok) {
        setPreview(result.preview);
      } else {
        setError(result.message);
      }
    });
  }

  function confirm() {
    if (!file) {
      return;
    }

    start(async () => {
      const result = await confirmSabiAction(form(file));

      if (result.ok) {
        setDone(result.message);
        setPreview(null);
        setFile(null);

        if (input.current) {
          input.current.value = "";
        }

        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  const status = sabi.importedAt
    ? { tone: "bg-[#e6f6f3] text-[#0f766e]", text: `Importado de SABI · ${sabi.importedAt}` }
    : sabi.hasCif
      ? { tone: "bg-[#fff4e5] text-[#9a5b00]", text: "Pendiente SABI" }
      : { tone: "bg-[#f1f3f7] text-[#5c6b78]", text: "Sin CIF todavía" };

  return (
    <section aria-labelledby="sabi-heading" className="rounded-2xl border border-[#e7eaee] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sabi-heading" className="text-base font-semibold text-[#1c2740]">
            Datos SABI
          </h2>
          <p className="mt-1 text-sm text-[#5c6b78]">
            Sube el Excel exportado de SABI para rellenar la ficha. Solo lo ve el equipo de Relify.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.text}</span>
      </div>

      {sabi.requestedAt && !sabi.importedAt ? (
        <p className="mt-3 text-xs text-[#5c6b78]">CIF introducido por el vendedor el {sabi.requestedAt}.</p>
      ) : null}
      {sabi.fileName ? <p className="mt-3 text-xs text-[#5c6b78]">Último archivo: {sabi.fileName}</p> : null}

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#c9d1e0] bg-[#f7f8fb] px-4 py-4 text-sm text-[#1c2740] hover:border-[#0f766e]">
        <FileSpreadsheet className="size-5 shrink-0 text-[#0f766e]" aria-hidden />
        <span className="font-medium">{file ? file.name : sabi.importedAt ? "Sustituir con otro Excel de SABI" : "Elegir Excel de SABI (.xlsx)"}</span>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(event) => choose(event.target.files?.[0] ?? null)}
          disabled={pending}
        />
      </label>

      {pending ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#5c6b78]">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Leyendo…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-[#b42318]">
          {error}
        </p>
      ) : null}
      {done ? (
        <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="size-4" aria-hidden /> {done}
        </p>
      ) : null}

      {preview ? <PreviewBlock preview={preview} onConfirm={confirm} onCancel={() => choose(null)} pending={pending} /> : null}

      {sabi.importedAt ? <StoredBlock sabi={sabi} /> : null}
    </section>
  );
}

function PreviewBlock({ preview, onConfirm, onCancel, pending }: { preview: SabiPreview; onConfirm: () => void; onCancel: () => void; pending: boolean }) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Fact label="Razón social" value={preview.legalName} />
        <Fact label="CIF" value={preview.cif} />
        <Fact label="Forma jurídica" value={preview.legalForm} />
        <Fact label="Constitución" value={isoDay(preview.incorporatedOn)} />
        <Fact label="Domicilio" value={preview.address} />
        <Fact label="Empleados" value={preview.employees === null ? null : String(preview.employees)} />
        <Fact label="CNAE 2009" value={preview.cnae} />
        <Fact label="Ejercicios en el archivo" value={`${preview.yearsInFile} (se cargan ${preview.years.length})`} />
        <Fact label="Administradores" value={String(preview.directors)} />
        <Fact label="Accionistas" value={String(preview.shareholders)} />
      </dl>

      <div className="overflow-x-auto rounded-xl border border-[#e7eaee]">
        <table className="w-full min-w-[40rem] text-right text-sm">
          <thead className="bg-[#f7f8fb] text-xs text-[#5c6b78]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Ejercicio</th>
              <th className="px-3 py-2 font-semibold">Ventas</th>
              <th className="px-3 py-2 font-semibold">EBITDA</th>
              <th className="px-3 py-2 font-semibold">Resultado</th>
              <th className="px-3 py-2 font-semibold">Activo total</th>
              <th className="px-3 py-2 font-semibold">Fondos propios</th>
              <th className="px-3 py-2 font-semibold">Empleados</th>
            </tr>
          </thead>
          <tbody>
            {preview.years.map((year) => (
              <tr key={year.year} className="border-t border-[#eef0f4] text-[#1c2740]">
                <td className="px-3 py-2 text-left font-medium">
                  {year.year}
                  {year.months !== null && year.months !== 12 ? <span className="ml-1 text-xs text-[#9a5b00]">({year.months} meses)</span> : null}
                  {year.replacesSeller ? <span className="ml-1 text-xs text-[#9a5b00]">· sustituye</span> : null}
                </td>
                <td className="px-3 py-2 tabular-nums">{money(year.salesCents)}</td>
                <td className="px-3 py-2 tabular-nums">{money(year.ebitdaCents)}</td>
                <td className="px-3 py-2 tabular-nums">{money(year.netResultCents)}</td>
                <td className="px-3 py-2 tabular-nums">{money(year.totalAssetsCents)}</td>
                <td className="px-3 py-2 tabular-nums">{money(year.equityCents)}</td>
                <td className="px-3 py-2 tabular-nums">{year.employees ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview.warnings.length > 0 ? (
        <ul className="flex flex-col gap-1.5 rounded-xl bg-[#fff8eb] px-4 py-3 text-sm text-[#7a4a00]">
          {preview.warnings.map((warning) => (
            <li key={warning} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {warning}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#0f766e]">Sin avisos: el archivo cuadra.</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded-full bg-[#1c2740] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-60"
        >
          Confirmar e importar
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className="rounded-full px-4 py-2.5 text-sm font-medium text-[#5c6b78] hover:text-[#1c2740]">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-[#5c6b78]">{label}</dt>
      <dd className="font-medium text-[#1c2740]">{value || "—"}</dd>
    </div>
  );
}

function Holdings({ title, rows }: { title: string; rows: AdminSabiHolding[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1c2740]">{title}</h3>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-[#1c2740]">
        {rows.map((row, index) => (
          <li key={`${row.name}-${index}`} className="flex justify-between gap-3">
            <span>
              {row.name}
              {row.country ? <span className="text-[#5c6b78]"> · {row.country}</span> : null}
            </span>
            <span className="tabular-nums text-[#5c6b78]">{row.direct ?? row.total ?? "—"} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoredBlock({ sabi }: { sabi: AdminSabiView }) {
  return (
    <div className="mt-6 grid gap-6 border-t border-[#eef0f4] pt-5 md:grid-cols-2">
      <dl className="grid gap-y-2 text-sm">
        <Fact label="Forma jurídica" value={sabi.legalForm} />
        <Fact label="Constitución" value={isoDay(sabi.incorporatedOn)} />
        <Fact label="Empleados" value={sabi.employees === null ? null : String(sabi.employees)} />
        <Fact label="Auditor" value={sabi.auditor} />
        <Fact label="Bancos" value={sabi.banks.join(" · ") || null} />
        <Fact label="Estado" value={sabi.status} />
        <Fact label="Denominación anterior" value={sabi.formerName} />
        <Fact label="Capital social" value={sabi.shareCapitalCents === null ? null : money(sabi.shareCapitalCents)} />
        <Fact label="Teléfono" value={sabi.phone} />
        <Fact label="Web" value={sabi.website} />
        <Fact label="Últimas cuentas" value={sabi.lastAccountsOn ? isoDay(sabi.lastAccountsOn) : null} />
        <Fact label="Tipo de cuentas" value={sabi.accountsType} />
        <Fact label="Matriz última (GUO)" value={sabi.globalUltimateOwner} />
        <Fact label="Indicador de independencia" value={sabi.independence} />
        {sabi.otherCodes.map((entry) => (
          <Fact key={entry.scheme} label={schemeLabels[entry.scheme] ?? entry.scheme.toUpperCase()} value={entry.codes} />
        ))}
        {sabi.activityDescription ? (
          <div className="flex flex-col">
            <dt className="text-xs text-[#5c6b78]">Descripción de actividad (SABI, solo admin)</dt>
            <dd className="whitespace-pre-line text-[#1c2740]">{sabi.activityDescription}</dd>
          </div>
        ) : null}
      </dl>
      <div className="flex flex-col gap-5">
        {sabi.directors.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-[#1c2740]">Administradores y directivos</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-[#1c2740]">
              {sabi.directors.map((person, index) => (
                <li key={`${person.name}-${index}`}>
                  {person.name}
                  <span className="text-[#5c6b78]">
                    {" "}
                    · {person.role}
                    {person.since ? ` desde ${isoDay(person.since)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Holdings title="Accionistas" rows={sabi.shareholders} />
        <Holdings title="Participadas" rows={sabi.subsidiaries} />
      </div>
    </div>
  );
}
