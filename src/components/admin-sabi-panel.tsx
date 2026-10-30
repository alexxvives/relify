"use client";

import { useEffect, useRef, useState, useTransition, type ComponentProps, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { confirmSabiAction } from "@/app/(app)/admin/empresas/[slug]/sabi-actions";
import { sabiFailureMessages, sabiMaxBytes } from "@/lib/sabi/failures";
import { mapSabiReport } from "@/lib/sabi/mapping";
import { parseSabiWorkbookStaged, sabiStages, type SabiStage } from "@/lib/sabi/parse";
import { buildSabiPreview, type SabiPreview } from "@/lib/sabi/preview";
import { CompanyBanner } from "@/components/company-banner";
import type { AdminSabiView } from "@/server/getAdminCompany";

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

/** Company banner with a compact "Subir SABI" file button in its top-right corner; preview, confirm and stored data render below it. */
export function AdminSabiPanel({ sabi, banner }: { sabi: AdminSabiView; banner: Omit<ComponentProps<typeof CompanyBanner>, "children"> }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SabiPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [stages, setStages] = useState<Partial<Record<SabiStage, number>>>({});
  const [saving, setSaving] = useState(false);

  // t67: drag-and-drop on the button and on the drop zone; clicking still opens the file picker.
  const dropProps = {
    onDragEnter: (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = pending ? "none" : "copy";
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setDragging(false);
      }
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);

      if (!pending) {
        choose(event.dataTransfer.files?.[0] ?? null);
      }
    },
  };

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
    setStages({});

    if (!chosen) {
      return;
    }

    // t67: the file is read in the browser (no upload, no server round trip) for the preview.
    start(async () => {
      if (chosen.size > sabiMaxBytes) {
        setError(sabiFailureMessages.too_large);
        return;
      }

      // t67: each section is reported as soon as it is parsed.
      const parsed = await parseSabiWorkbookStaged(new Uint8Array(await chosen.arrayBuffer()), ({ stage, count }) => {
        setStages((current) => ({ ...current, [stage]: count }));
      });

      if (!parsed.ok) {
        setError(sabiFailureMessages[parsed.code]);
        return;
      }

      setPreview(buildSabiPreview(parsed.report, mapSabiReport(parsed.report), sabi.previewTarget, chosen.name));
    });
  }

  function confirm() {
    if (!file) {
      return;
    }

    setSaving(true);
    start(async () => {
      const result = await confirmSabiAction(form(file));
      setSaving(false);

      if (result.ok) {
        setDone(result.message);
        setPreview(null);
        setStages({});
        setFile(null);

        if (input.current) {
          input.current.value = "";
        }
      } else {
        setError(result.message);
      }
    });
  }

  // t67: refresh once the action's transition has settled. Calling router.refresh() inside it left
  // the button on "Leyendo…" and the ficha stale until a manual reload.
  useEffect(() => {
    if (done) {
      router.refresh();
    }
  }, [done, router]);

  const status = sabi.importedAt
    ? `Importado de SABI · ${sabi.importedAt}`
    : sabi.hasCif
      ? `Pendiente SABI${sabi.requestedAt ? ` · CIF introducido el ${sabi.requestedAt}` : ""}`
      : "Sin CIF todavía";
  const label = pending ? "Leyendo…" : sabi.importedAt ? "Sustituir SABI" : "Subir SABI";

  return (
    <>
      <CompanyBanner {...banner}>
        <label
          {...dropProps}
          title={`${status}${sabi.fileName ? ` · Último archivo: ${sabi.fileName}` : ""}`}
          className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium text-white backdrop-blur focus-within:ring-2 focus-within:ring-white/70 ${
            dragging ? "border-[#7fd6cc] bg-[#0f766e]/60 ring-2 ring-[#7fd6cc]" : sabi.hasCif && !sabi.importedAt ? "border-[#ff8a8a]/80 bg-[#c0362c]/35 hover:bg-[#c0362c]/50" : "border-white/35 bg-white/10 hover:bg-white/20"
          }`}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileSpreadsheet className="size-4" aria-hidden />}
          <span>{label}</span>
          <span className="sr-only"> ({status})</span>
          <input
            ref={input}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => choose(event.target.files?.[0] ?? null)}
            disabled={pending}
          />
        </label>
      </CompanyBanner>
      <section aria-label="SABI" className="rounded-2xl border border-[#e7eaee] bg-white p-5 sm:p-6">
        {preview ? null : (
          <div
            {...dropProps}
            role="button"
            tabIndex={0}
            aria-disabled={pending}
            onClick={() => (pending ? undefined : input.current?.click())}
            onKeyDown={(event) => {
              if (!pending && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                input.current?.click();
              }
            }}
            className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2fc4b2] ${
              dragging ? "border-[#2fc4b2] bg-[#e6f6f3] text-[#0f766e]" : "border-[#d5dbe3] text-[#5c6b78] hover:border-[#7fd6cc] hover:bg-[#f4fbfa]"
            }`}
          >
            <UploadCloud className="size-6 text-[#0f766e]" aria-hidden />
            <span className="font-medium text-[#1c2740]">{dragging ? "Suelta el archivo para leerlo" : "Arrastra aquí el Excel de SABI (.xlsx)"}</span>
            <span className="text-xs">o haz clic para elegirlo · máx. {Math.round(sabiMaxBytes / 1024 / 1024)} MB</span>
          </div>
        )}
        {pending || saving || Object.keys(stages).length > 0 ? <SabiProgress stages={stages} saving={saving} parsing={pending && !saving} /> : null}
        {file && preview ? <p className="text-xs text-[#5c6b78]">{file.name}</p> : null}
        {error ? (
          <p role="alert" className="text-sm font-medium text-[#b42318]">
            {error}
          </p>
        ) : null}
        {done ? (
          <p role="status" className="inline-flex items-center gap-2 text-sm font-medium text-[#0f766e]">
            <CheckCircle2 className="size-4" aria-hidden /> {done}
          </p>
        ) : null}
        {preview ? <PreviewBlock preview={preview} onConfirm={confirm} onCancel={() => choose(null)} pending={pending} /> : null}
        {sabi.importedAt && !preview ? (
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-medium text-[#465ab4] hover:underline">
              <span className="group-open:hidden">Ver datos SABI importados</span>
              <span className="hidden group-open:inline">Ocultar datos SABI</span>
              <span className="ml-2 text-xs font-normal text-[#5c6b78]">{status}</span>
            </summary>
            <StoredBlock sabi={sabi} />
          </details>
        ) : null}
      </section>
    </>
  );
}

const stageLabels: Record<SabiStage, string> = {
  read: "Archivo",
  general: "Datos generales",
  balance: "Balance",
  results: "Cuenta de resultados",
  ratios: "Ratios",
  directors: "Administradores",
  shareholders: "Accionistas",
};

function stageCount(stage: SabiStage, count: number): string {
  if (stage === "read") {
    return `${count} filas`;
  }

  if (stage === "directors" || stage === "shareholders") {
    return String(count);
  }

  return `${count} datos`;
}

/** t67: the sections already read from the file, then "Guardando…" while the import runs. */
function SabiProgress({ stages, saving, parsing }: { stages: Partial<Record<SabiStage, number>>; saving: boolean; parsing: boolean }) {
  const next = sabiStages.find((stage) => stages[stage] === undefined);

  return (
    <ol aria-label="Progreso de lectura SABI" aria-live="polite" className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
      {sabiStages.map((stage) => {
        const count = stages[stage];
        const active = parsing && stage === next;
        return (
          <li key={stage} className={`inline-flex items-center gap-1.5 ${count !== undefined ? "text-[#0f766e]" : active ? "text-[#1c2740]" : "text-[#9aa5b1]"}`}>
            {count !== undefined ? <CheckCircle2 className="size-4" aria-hidden /> : active ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <span className="size-4 rounded-full border border-current" aria-hidden />}
            {stageLabels[stage]}
            {count !== undefined ? <span className="text-xs text-[#5c6b78]">({stageCount(stage, count)})</span> : null}
          </li>
        );
      })}
      {saving ? (
        <li className="inline-flex items-center gap-1.5 font-medium text-[#1c2740]">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Guardando…
        </li>
      ) : null}
    </ol>
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
      <ExtraBlock sabi={sabi} />
    </div>
  );
}

function columnName(index: number): string {
  let name = "";
  let n = index;

  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }

  return name;
}

/** t62: everything in the file without its own column, so nothing from SABI is lost. */
function ExtraBlock({ sabi }: { sabi: AdminSabiView }) {
  const extra = sabi.extra;
  return (
    <div className="flex flex-col gap-4 md:col-span-2">
      <dl className="grid gap-y-2 text-sm sm:grid-cols-2">
        <Fact label="Tipo de empresa" value={sabi.companyType} />
        <Fact label="Empresas en el grupo corporativo" value={sabi.groupCompanyCount === null ? null : String(sabi.groupCompanyCount)} />
      </dl>
      <p className="text-xs text-[#5c6b78]">Administradores, accionistas, participadas, auditorías, bancos y códigos: ver «Registro mercantil y grupo (SABI)» en la ficha.</p>
      {extra ? (
        <details className="rounded-xl border border-[#e7eaee] p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-[#1c2740]">
            Resto del archivo SABI (sabi_extra) · {extra.olderYears.length} ejercicios anteriores · {extra.sheet.length} filas
          </summary>
          {extra.unmappedLabels.length > 0 ? (
            <p className="mt-2 text-[#5c6b78]">Líneas sin campo propio: {extra.unmappedLabels.join(" · ")}</p>
          ) : null}
          {extra.olderYears.length > 0 ? (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-[#5c6b78]">Ejercicios fuera de la ficha</h4>
              <ul className="mt-1 flex flex-col gap-1">
                {extra.olderYears.map((year) => (
                  <li key={year.year} className="tabular-nums">
                    {year.year}: ingresos {money(year.money.operatingRevenue ?? year.money.sales ?? null)} · resultado {money(year.money.netResult ?? null)} · activo{" "}
                    {money(year.money.totalAssets ?? null)} · {year.employees ?? "—"} empleados
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-3 max-h-[28rem] overflow-auto rounded-lg border border-[#eef0f4]">
            <table className="w-full text-left text-xs">
              <tbody>
                {extra.sheet.map(([row, cells]) => (
                  <tr key={row} className="border-t border-[#eef0f4] align-top">
                    <th className="sticky left-0 bg-[#f6f7f9] px-2 py-1 font-medium text-[#5c6b78] tabular-nums">{row}</th>
                    <td className="px-2 py-1 text-[#1c2740]">
                      {cells.map(([column, text]) => (
                        <span key={column} className="mr-3 inline-block whitespace-pre-line">
                          <span className="text-[#98a2b3]">{columnName(column)} </span>
                          {text}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
