"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ComponentProps, type DragEvent, type ReactNode } from "react";
import { sabiJobStageLabel, sabiJobStartedEvent, sabiJobUpdateEvent, type SabiJobUpdate } from "@/lib/sabi/job-events";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import { confirmSabiAction } from "@/app/(app)/admin/empresas/[slug]/sabi-actions";
import { approveProjectAction, unpublishProjectAction } from "@/app/(app)/admin/actions";
import { AppToast } from "@/components/app-toast";
import { adminCopy } from "@/lib/admin-copy";
import { sabiFailureMessages, sabiMaxBytes } from "@/lib/sabi/failures";
import { mapSabiReport } from "@/lib/sabi/mapping";
import { parseSabiWorkbookStaged, sabiStages, type SabiStage } from "@/lib/sabi/parse";
import { buildSabiPreview, type SabiPreview } from "@/lib/sabi/preview";
import { InvestorProjectTabs } from "@/components/investor-project-tabs";
import { AdminReportNotice } from "@/components/admin-report-notice";
import type { AdminSabiView } from "@/server/getAdminCompany";
import { CompanyBanner } from "@/components/company-banner";
import type { SectorImageKey } from "@/lib/sector-image";

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

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

type AdminHeader = {
  title: string;
  subtitle?: string | null;
  status?: { label: string; live: boolean };
  statusNote?: ReactNode;
  cue?: ReactNode;
  progress?: ReactNode;
  /** t83: sector family tile and neutral chips (sector, region, founding decade), as on the buyer banner. */
  sector?: SectorImageKey | null;
  chips?: string[];
};

/**
 * t81/t88b: admin company page. The header is the shared CompanyBanner, hero variant (t91, as buyer and seller see it), with the
 * status, readiness chip and deal progress in its slots; "Subir/Reimportar SABI" and "Notificar al vendedor" live at
 * the right end of the tab row. Header and tab row together are the SABI drop zone.
 */
export function AdminSabiPanel({
  sabi,
  header,
  panels,
  between = null,
  listingStatus = "draft",
}: {
  sabi: AdminSabiView;
  header: AdminHeader;
  panels: ComponentProps<typeof InvestorProjectTabs>["panels"];
  listingStatus?: "draft" | "pending" | "published";
  /** Rendered between the header and the tabs (e.g. the buyer label of the selected process). */
  between?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SabiPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [approveState, approveAction, approvePending] = useActionState(approveProjectAction, null);
  const [unpublishState, unpublishAction, unpublishPending] = useActionState(unpublishProjectAction, null);
  const [dragging, setDragging] = useState(false);
  const [stages, setStages] = useState<Partial<Record<SabiStage, number>>>({});
  const [saving, setSaving] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [serverStage, setServerStage] = useState("queued");

  // t72: drag-and-drop anywhere on the banner; clicking the button still opens the file picker.
  const dropProps = {
    onDragEnter: (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = pending || saving ? "none" : "copy";
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setDragging(false);
      }
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);

      if (!(pending || saving)) {
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
    setServerStage("queued");
    start(async () => {
      // t67: the server answers at once with a job id; the import runs in the background and the
      // admin-wide indicator polls it, so the admin can leave this page meanwhile.
      const result = await confirmSabiAction(form(file));

      if (!result.ok) {
        setSaving(false);
        setError(result.message);
        return;
      }

      setJobId(result.jobId);
      window.dispatchEvent(new CustomEvent(sabiJobStartedEvent, { detail: { jobId: result.jobId } }));
    });
  }

  useEffect(() => {
    if (!jobId) {
      return;
    }

    function update(event: Event) {
      const job = (event as CustomEvent<SabiJobUpdate>).detail;

      if (job.id !== jobId) {
        return;
      }

      setServerStage(job.stage);

      if (job.status === "running") {
        return;
      }

      setSaving(false);
      setJobId(null);
      setStages({});

      if (job.status === "done") {
        setDone(job.message ?? "Ficha actualizada con SABI.");
        setPreview(null);
        setFile(null);

        if (input.current) {
          input.current.value = "";
        }
      } else {
        setError(job.message ?? sabiFailureMessages.not_xlsx);
      }
    }

    window.addEventListener(sabiJobUpdateEvent, update);
    return () => window.removeEventListener(sabiJobUpdateEvent, update);
  }, [jobId]);

  const status = sabi.importedAt
    ? `Importado de SABI · ${sabi.importedAt}`
    : sabi.hasCif
      ? `Pendiente SABI${sabi.requestedAt ? ` · CIF introducido el ${sabi.requestedAt}` : ""}`
      : "Sin CIF todavía";
  const busy = pending || saving;
  const label = saving ? "Importando…" : pending ? "Leyendo…" : sabi.importedAt ? "Reimportar SABI" : "Subir SABI";
  const maxMb = Math.round(sabiMaxBytes / 1024 / 1024);
  const showPanel = busy || Object.keys(stages).length > 0 || preview !== null || error !== null || done !== null;

  const panel = showPanel ? (
    <section aria-label="SABI" className="rounded-2xl border border-[#e7eaee] bg-white p-5 sm:p-6">
      {pending || saving || Object.keys(stages).length > 0 ? <SabiProgress stages={stages} saving={saving ? sabiJobStageLabel(serverStage) : null} parsing={pending && !saving} /> : null}
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
      {preview ? <PreviewBlock preview={preview} onConfirm={confirm} onCancel={() => choose(null)} pending={busy} /> : null}
    </section>
  ) : null;

  const actions = (
    <>
      {listingStatus === "pending" ? (
        <form
          action={approveAction}
          onSubmit={(event) => {
            if (!window.confirm(adminCopy.publishConfirm)) event.preventDefault();
          }}
        >
          <input type="hidden" name="projectId" value={sabi.projectId} />
          <button
            type="submit"
            disabled={approvePending}
            className="inline-flex h-9 items-center rounded-full bg-[#465ab4] px-3.5 text-sm font-medium text-white hover:bg-[#3a4d9e] disabled:opacity-60"
          >
            {approvePending ? adminCopy.approving : adminCopy.approve}
          </button>
        </form>
      ) : null}
      {listingStatus === "published" ? (
        <form
          action={unpublishAction}
          onSubmit={(event) => {
            if (!window.confirm(adminCopy.unpublishConfirm)) event.preventDefault();
          }}
        >
          <input type="hidden" name="projectId" value={sabi.projectId} />
          <button
            type="submit"
            disabled={unpublishPending}
            className="inline-flex h-9 items-center rounded-full bg-[#c0362c] px-3.5 text-sm font-semibold text-white hover:bg-[#a52d24] disabled:opacity-60"
          >
            {unpublishPending ? adminCopy.unpublishing : adminCopy.unpublish}
          </button>
        </form>
      ) : null}
      <label
        title={`${status}${sabi.fileName ? ` · Último archivo: ${sabi.fileName}` : ""} · Excel de SABI (.xlsx), máx. ${maxMb} MB. También puedes arrastrarlo a la cabecera.`}
        className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium focus-within:ring-2 focus-within:ring-[#0f766e]/40 ${
          dragging
            ? "border-[#0f766e] bg-[#e6f4f1] text-[#0f766e]"
            : "border-[#d5dbe3] bg-white text-[#1c2740] hover:border-[#0f766e] hover:text-[#0f766e]"
        }`}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : sabi.importedAt ? <RefreshCw className="size-3.5" aria-hidden /> : <FileSpreadsheet className="size-4" aria-hidden />}
        <span>{label}</span>
        <span className="sr-only"> ({status}). Excel de SABI .xlsx, máximo {maxMb} MB.</span>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(event) => choose(event.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </label>
      <AdminReportNotice variant="page" projectId={sabi.projectId} imported={sabi.importedAt !== null} report={sabi.report} />
      {approveState && !approveState.ok ? (
        <p role="alert" className="text-xs font-medium text-[#b42318]">
          {approveState.message}
        </p>
      ) : null}
      {unpublishState && !unpublishState.ok ? (
        <p role="alert" className="text-xs font-medium text-[#b42318]">
          {unpublishState.message}
        </p>
      ) : null}
      <AppToast message={approveState?.ok ? approveState.message : unpublishState?.ok ? unpublishState.message : null} />
    </>
  );

  return (
    <div {...dropProps} className="relative flex flex-col gap-4">
      {/* t91: the same hero sector banner buyer and seller see; admin extras (status, readiness, deal progress, cue) ride in its slots. */}
      <CompanyBanner
        title={header.title}
        subtitle={header.chips && header.chips.length > 0 ? undefined : (header.subtitle ?? undefined)}
        sector={header.sector ?? null}
        chips={header.chips ?? []}
        status={header.status}
        statusNote={header.statusNote}
        progress={header.progress}
        cue={header.cue}
      />
      {between}
      <InvestorProjectTabs panels={panels} actions={actions} notice={panel ? <div className="mt-4">{panel}</div> : null} />
      {dragging ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#0f766e] bg-[#e6f4f1]/95 text-center text-[#0f766e]"
        >
          <UploadCloud className="size-8" aria-hidden />
          <span className="text-base font-semibold">{busy ? "Espera a que termine la importación" : "Suelta el Excel de SABI para leerlo"}</span>
          <span className="text-xs">.xlsx · máx. {maxMb} MB</span>
        </div>
      ) : null}
    </div>
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
function SabiProgress({ stages, saving, parsing }: { stages: Partial<Record<SabiStage, number>>; saving: string | null; parsing: boolean }) {
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
          {saving !== "Guardando…" ? <span className="text-xs font-normal text-[#5c6b78]">(servidor: {saving})</span> : null}
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
