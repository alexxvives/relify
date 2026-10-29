"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition, type DragEvent, type ReactNode } from "react";
import { confirmFilingAction, deleteFilingAction } from "@/app/(app)/mi-empresa/financieros/actions";
import {
  balanceFilingKeys,
  filingByteLimit,
  filingLabels,
  formatEuroInput,
  parseEuroInput,
  pnlFilingKeys,
  reviewFlags,
  salesGrowth,
  yearRatios,
  type FilingAmountKey,
  type YearAmounts,
} from "@/lib/financial-filing";
import type { FilingSummary } from "@/server/financialFilings";

const errorCopy: Record<string, string> = {
  forbidden: "No tienes permiso para hacer esto. Vuelve a iniciar sesión.",
  year: "Ese ejercicio no está disponible.",
  empty: "El archivo está vacío.",
  "too-large": "El archivo supera los 8 MB.",
  type: "Solo aceptamos PDF (Modelo 200 o cuentas anuales) o XBRL.",
  unreadable: "No hemos podido leer el documento. Puedes subir otro o escribir las cifras a mano.",
  "no-data": "No hemos encontrado cifras en el documento. Puedes subir otro o escribir las cifras a mano.",
  invalid: "Revisa las cifras marcadas: hay algún valor que no es un número.",
  missing: "Primero sube el documento de este ejercicio.",
  network: "Se ha cortado la conexión. Inténtalo de nuevo.",
};

const kindCopy: Record<string, string> = { modelo200: "Modelo 200", cuentas: "Cuentas anuales", xbrl: "XBRL" };

const gestorMessage = (years: number[]) =>
  `Hola, ¿me puedes enviar en PDF el Modelo 200 (Impuesto sobre Sociedades) de los ejercicios ${years
    .slice()
    .sort()
    .join(", ")}? Es la copia de la declaración presentada que se descarga en la Sede de la Agencia Tributaria. Gracias.`;

const percent = new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 });
const ratio = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#e7eaee] bg-white p-5 sm:p-6 ${className}`}>{children}</section>;
}

function LockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function UploadGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  );
}

export function FinancialsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando datos financieros">
      <div className="h-24 animate-pulse rounded-2xl bg-[#eef1f5]" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-52 animate-pulse rounded-2xl bg-[#eef1f5]" />
        ))}
      </div>
    </div>
  );
}

function Guide({ years }: { years: number[] }) {
  const [copied, setCopied] = useState(false);
  const message = gestorMessage(years);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <details className="group rounded-2xl border border-[#e7eaee] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium text-[#1c2740]">¿Dónde consigo el Modelo 200?</span>
          <span className="mt-1 block text-sm text-[#5c6b78]">Se descarga en la Sede electrónica de la Agencia Tributaria. Tarda unos minutos.</span>
        </span>
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0 text-[#5c6b78] transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="grid gap-6 border-t border-[#e7eaee] p-5 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <ol className="space-y-3 text-sm leading-6 text-[#2b3b4a]">
          {[
            <>
              Entra en la <strong className="font-medium">Sede electrónica de la AEAT</strong> e identifícate con el certificado electrónico de la
              empresa (o de su representante) o con Cl@ve.
            </>,
            <>
              Ve a <strong className="font-medium">Mis expedientes</strong>, o busca «Modelo 200» y abre{" "}
              <strong className="font-medium">Consulta de declaraciones presentadas</strong>.
            </>,
            <>Escribe el NIF de la empresa, el modelo 200 y el ejercicio, y pulsa «Buscar».</>,
            <>
              En la columna <strong className="font-medium">Obtención del justificante</strong>, pulsa «Ver» y guarda el PDF con la copia de la declaración.
            </>,
            <>Repite con cada ejercicio y súbelos aquí abajo.</>,
          ].map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#eef0fa] text-xs font-semibold text-[#465ab4]">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
          <li className="pt-1">
            <a
              href="https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/otros-servicios-ayuda-tecnica/consulta-declaraciones-presentadas.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-xl border border-[#d5dbe4] px-4 text-sm font-medium text-[#1c2740] hover:bg-[#f4f6fb]"
            >
              Abrir la Sede de la Agencia Tributaria ↗
            </a>
          </li>
        </ol>
        <div className="rounded-xl bg-[#f6f7fb] p-4">
          <p className="font-medium text-[#1c2740]">¿Lo lleva tu gestor?</p>
          <p className="mt-1 text-sm leading-6 text-[#5c6b78]">Es lo más rápido: tiene acceso a tus declaraciones. Envíale este mensaje tú mismo.</p>
          <p className="mt-3 rounded-lg border border-[#e7eaee] bg-white p-3 text-sm leading-6 text-[#2b3b4a]">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="inline-flex h-9 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white">
              {copied ? "Copiado ✓" : "Copiar mensaje"}
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent("Modelo 200 de la empresa")}&body=${encodeURIComponent(message)}`}
              className="inline-flex h-9 items-center rounded-full border border-[#d5dbe4] bg-white px-4 text-sm font-medium text-[#1c2740] hover:bg-[#f4f6fb]"
            >
              Email
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-full border border-[#d5dbe4] bg-white px-4 text-sm font-medium text-[#1c2740] hover:bg-[#f4f6fb]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </details>
  );
}

type SlotState = { phase: "idle" } | { phase: "uploading"; progress: number } | { phase: "reading" } | { phase: "error"; code: string };

function StatusChip({ filing }: { filing?: FilingSummary }) {
  if (!filing) {
    return <span className="rounded-full bg-[#f1f3f6] px-2.5 py-0.5 text-xs font-medium text-[#5c6b78]">Pendiente</span>;
  }

  const map = {
    confirmed: ["bg-[#e6f4ef] text-[#1f7a5a]", "Confirmado"],
    extracted: ["bg-[#fff4dc] text-[#8a5a00]", "Por revisar"],
    failed: ["bg-[#fdecec] text-[#a33a3a]", "Sin cifras"],
    uploaded: ["bg-[#f1f3f6] text-[#5c6b78]", "Subido"],
  } as const;
  const [tone, label] = map[filing.status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}

function YearSlot({
  year,
  filing,
  selected,
  onUploaded,
  onReview,
}: {
  year: number;
  filing?: FilingSummary;
  selected: boolean;
  onUploaded: (filing: FilingSummary) => void;
  onReview: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<SlotState>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();
  const busy = state.phase === "uploading" || state.phase === "reading";

  function send(file: File) {
    if (file.size > filingByteLimit) {
      setState({ phase: "error", code: "too-large" });
      return;
    }

    const body = new FormData();
    body.set("year", String(year));
    body.set("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/mi-empresa/financieros/subir");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setState(progress >= 100 ? { phase: "reading" } : { phase: "uploading", progress });
      }
    };
    request.upload.onload = () => setState({ phase: "reading" });
    request.onerror = () => setState({ phase: "error", code: "network" });
    request.onload = () => {
      const result = request.response as { ok: boolean; code?: string; filing?: FilingSummary } | null;

      if (result?.ok && result.filing) {
        setState({ phase: "idle" });
        onUploaded(result.filing);
        router.refresh();
      } else {
        setState({ phase: "error", code: result?.code ?? "network" });
      }
    };
    setState({ phase: "uploading", progress: 0 });
    request.send(body);
  }

  function pick(files: FileList | null) {
    const file = files?.[0];

    if (file) {
      send(file);
    }
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);

    if (!busy) {
      pick(event.dataTransfer.files);
    }
  }

  function remove() {
    if (!window.confirm(`¿Eliminar el documento de ${year}? Las cifras que ya hayas confirmado se mantienen.`)) {
      return;
    }

    startDelete(async () => {
      const result = await deleteFilingAction(year);
      setState(result.ok ? { phase: "idle" } : { phase: "error", code: result.code });
      router.refresh();
    });
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 transition ${selected ? "border-[#465ab4] ring-2 ring-[#465ab4]/15" : "border-[#e7eaee]"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-[#1c2740]">Ejercicio {year}</h3>
        <StatusChip filing={filing} />
      </div>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf,.xbrl,.xml,.zip"
        className="sr-only"
        aria-label={`Subir documento de ${year}`}
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = "";
        }}
      />

      {busy ? (
        <div className="mt-4 flex flex-1 flex-col justify-center rounded-xl bg-[#f6f7fb] p-4" role="status" aria-live="polite">
          <p className="text-sm font-medium text-[#1c2740]">{state.phase === "uploading" ? `Subiendo… ${state.progress}%` : "Leyendo las cifras…"}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e2e6f0]">
            <div
              className={`h-full rounded-full bg-[#465ab4] transition-all ${state.phase === "reading" ? "w-full animate-pulse" : ""}`}
              style={state.phase === "uploading" ? { width: `${state.progress}%` } : undefined}
            />
          </div>
          {state.phase === "reading" ? <p className="mt-2 text-xs text-[#5c6b78]">Puede tardar hasta un minuto.</p> : null}
        </div>
      ) : filing ? (
        <div className="mt-4 flex flex-1 flex-col">
          <a
            href={`/mi-empresa/financieros/archivo/${year}`}
            className="flex items-center gap-3 rounded-xl border border-[#e7eaee] p-3 hover:bg-[#f9fafc]"
            title="Descargar"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef0fa] text-[10px] font-bold text-[#465ab4]">
              {filing.kind === "xbrl" ? "XBRL" : "PDF"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#1c2740]">{filing.fileName}</span>
              <span className="block text-xs text-[#5c6b78]">
                {kindCopy[filing.kind]} · {sizeLabel(filing.sizeBytes)}
              </span>
            </span>
          </a>
          {filing.status === "failed" ? (
            <p className="mt-3 text-sm leading-6 text-[#a33a3a]">{errorCopy[filing.errorCode ?? "unreadable"] ?? errorCopy.unreadable}</p>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <button type="button" onClick={onReview} className="inline-flex h-9 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white">
              {filing.status === "confirmed" ? "Ver cifras" : filing.status === "failed" ? "Escribir a mano" : "Revisar cifras"}
            </button>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="inline-flex h-9 items-center rounded-full border border-[#d5dbe4] px-3 text-sm font-medium text-[#1c2740] hover:bg-[#f4f6fb]"
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-[#a33a3a] hover:bg-[#fdecec] disabled:opacity-60"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={`mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
            dragging ? "border-[#465ab4] bg-[#eef0fa]" : "border-[#d5dbe4] hover:border-[#465ab4] hover:bg-[#f9fafc]"
          }`}
        >
          <span className="text-[#465ab4]">
            <UploadGlyph />
          </span>
          <span className="text-sm font-medium text-[#1c2740]">Arrastra el PDF o pulsa para elegirlo</span>
          <span className="text-xs text-[#5c6b78]">Modelo 200, cuentas anuales o XBRL · máx. 8 MB</span>
        </button>
      )}
      {state.phase === "error" ? (
        <p className="mt-3 text-sm leading-6 text-[#a33a3a]" role="alert">
          {errorCopy[state.code] ?? errorCopy.network}
        </p>
      ) : null}
    </div>
  );
}

type Draft = { amounts: Record<FilingAmountKey, string>; cnae: string; averageHeadcount: string };

function draftFrom(filing: FilingSummary): Draft {
  const extraction = filing.extraction;
  const amounts = {} as Record<FilingAmountKey, string>;

  for (const key of [...pnlFilingKeys, ...balanceFilingKeys]) {
    amounts[key] = formatEuroInput(extraction?.amounts[key]?.value ?? null);
  }

  return {
    amounts,
    cnae: extraction?.cnae.value ?? "",
    averageHeadcount: extraction?.averageHeadcount.value === null || !extraction ? "" : String(extraction.averageHeadcount.value).replace(".", ","),
  };
}

function parsedAmounts(draft: Draft): YearAmounts {
  return Object.fromEntries(Object.entries(draft.amounts).map(([key, value]) => [key, parseEuroInput(value)])) as YearAmounts;
}

function ReviewPanel({ filing, onClose, onConfirmed }: { filing: FilingSummary; onClose: () => void; onConfirmed: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(filing));
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();
  const amounts = useMemo(() => parsedAmounts(draft), [draft]);
  const flags = useMemo(() => (filing.status === "confirmed" ? new Set<FilingAmountKey>() : reviewFlags(amounts, filing.extraction)), [amounts, filing]);
  const ratios = yearRatios(amounts);
  const invalid = Object.entries(draft.amounts).some(([, value]) => value.trim() !== "" && parseEuroInput(value) === null);

  function setAmount(key: FilingAmountKey, value: string) {
    setDraft((current) => ({ ...current, amounts: { ...current.amounts, [key]: value } }));
  }

  function confirm() {
    setError(null);
    startSave(async () => {
      const result = await confirmFilingAction({ year: filing.year, amounts: draft.amounts, cnae: draft.cnae, averageHeadcount: draft.averageHeadcount });

      if (result.ok) {
        onConfirmed();
        router.refresh();
      } else {
        setError(errorCopy[result.code] ?? errorCopy.invalid);
      }
    });
  }

  const rows = (keys: readonly FilingAmountKey[]) =>
    keys.map((key) => {
      const flagged = flags.has(key);
      const bad = draft.amounts[key].trim() !== "" && parseEuroInput(draft.amounts[key]) === null;
      return (
        <tr key={key} className={flagged || bad ? "bg-[#fff8e6]" : undefined}>
          <th scope="row" className="py-2 pr-3 pl-3 text-left text-sm font-normal text-[#2b3b4a]">
            <label htmlFor={`f-${key}`}>{filingLabels[key]}</label>
            {flagged ? <span className="ml-2 rounded-full bg-[#ffe7a8] px-2 py-0.5 text-[11px] font-medium text-[#7a5000]">Revisa</span> : null}
          </th>
          <td className="py-1.5 pr-3">
            <div className="relative ml-auto w-full max-w-[11rem]">
              <input
                id={`f-${key}`}
                inputMode="decimal"
                value={draft.amounts[key]}
                onChange={(event) => setAmount(key, event.target.value)}
                aria-invalid={bad}
                placeholder="—"
                className={`h-9 w-full rounded-lg border bg-white pr-7 pl-3 text-right text-sm tabular-nums text-[#1c2740] outline-none focus:border-[#465ab4] focus:ring-2 focus:ring-[#465ab4]/15 ${
                  bad ? "border-[#d66]" : "border-[#d5dbe4]"
                }`}
              />
              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-[#8a96a3]">€</span>
            </div>
          </td>
        </tr>
      );
    });

  const ratioItems: Array<[string, string]> = [
    ["EBITDA", ratios.ebitda === null ? "—" : euros.format(ratios.ebitda)],
    ["Margen EBITDA", ratios.ebitdaMargin === null ? "—" : percent.format(ratios.ebitdaMargin)],
    ["Margen neto", ratios.netMargin === null ? "—" : percent.format(ratios.netMargin)],
    ["Endeudamiento", ratios.leverage === null ? "—" : `${ratio.format(ratios.leverage)}x`],
    ["Liquidez", ratios.liquidity === null ? "—" : ratio.format(ratios.liquidity)],
  ];

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1c2740]">Revisa las cifras de {filing.year}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5c6b78]">
            {filing.status === "confirmed"
              ? "Ya están confirmadas. Si cambias algo, vuelve a confirmar."
              : "Las hemos leído del documento. Comprueba las marcadas en amarillo y corrige lo que haga falta. Los gastos van en positivo."}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium text-[#5c6b78] hover:text-[#1c2740]">
          Cerrar
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <table className="w-full overflow-hidden rounded-xl border border-[#e7eaee]">
          <caption className="bg-[#f6f7fb] px-3 py-2 text-left text-xs font-semibold tracking-wide text-[#5c6b78] uppercase">Cuenta de resultados</caption>
          <tbody className="divide-y divide-[#eef0f3]">{rows(pnlFilingKeys)}</tbody>
        </table>
        <div className="space-y-5">
          <table className="w-full overflow-hidden rounded-xl border border-[#e7eaee]">
            <caption className="bg-[#f6f7fb] px-3 py-2 text-left text-xs font-semibold tracking-wide text-[#5c6b78] uppercase">Balance</caption>
            <tbody className="divide-y divide-[#eef0f3]">{rows(balanceFilingKeys)}</tbody>
          </table>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-[#2b3b4a]">
              CNAE principal
              <input
                value={draft.cnae}
                onChange={(event) => setDraft((current) => ({ ...current, cnae: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                inputMode="numeric"
                placeholder="Ej. 4711"
                className="mt-1 h-9 w-full rounded-lg border border-[#d5dbe4] px-3 text-sm tabular-nums outline-none focus:border-[#465ab4]"
              />
            </label>
            <label className="text-sm text-[#2b3b4a]">
              Plantilla media
              <input
                value={draft.averageHeadcount}
                onChange={(event) => setDraft((current) => ({ ...current, averageHeadcount: event.target.value.slice(0, 8) }))}
                inputMode="decimal"
                placeholder="Ej. 12,5"
                className="mt-1 h-9 w-full rounded-lg border border-[#d5dbe4] px-3 text-sm tabular-nums outline-none focus:border-[#465ab4]"
              />
            </label>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#f6f7fb] p-4 sm:grid-cols-5">
        {ratioItems.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-[#5c6b78]">{label}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-[#1c2740]">{value}</dd>
          </div>
        ))}
      </dl>

      {error ? (
        <p className="mt-4 text-sm text-[#a33a3a]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={saving || invalid}
          className="inline-flex h-11 items-center rounded-xl bg-[#465ab4] px-5 text-base font-medium text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : `Confirmar cifras de ${filing.year}`}
        </button>
        <p className="text-xs leading-5 text-[#5c6b78]">Al confirmar, estas cifras alimentan tu ficha y los gráficos que ven los compradores.</p>
      </div>
    </Card>
  );
}

export function FinancialsWorkspace({ years, filings }: { years: number[]; filings: FilingSummary[] }) {
  const [local, setLocal] = useState<Record<number, FilingSummary>>({});
  const [reviewYear, setReviewYear] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const byYear = useMemo(() => {
    const map = new Map<number, FilingSummary>();

    for (const filing of filings) {
      map.set(filing.year, filing);
    }

    for (const filing of Object.values(local)) {
      const server = map.get(filing.year);

      if (!server || new Date(filing.updatedAt) > new Date(server.updatedAt)) {
        map.set(filing.year, filing);
      }
    }

    return map;
  }, [filings, local]);
  const reviewing = reviewYear === null ? undefined : byYear.get(reviewYear);
  const confirmed = years.map((year) => byYear.get(year)).filter((filing): filing is FilingSummary => filing?.status === "confirmed");
  const growth = salesGrowth(confirmed.map((filing) => ({ year: filing.year, sales: filing.extraction?.amounts.sales?.value ?? null })));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-base leading-7 text-[#3d4f5f]">
          Sube el Modelo 200 (Impuesto sobre Sociedades) de los tres últimos ejercicios. Leemos las cifras por ti y tú las confirmas antes de que aparezcan
          en tu ficha.
        </p>
        <p className="inline-flex items-start gap-2 rounded-xl bg-[#eef6f4] px-3 py-2 text-sm leading-5 text-[#24584f] lg:max-w-sm">
          <LockIcon />
          <span>Documento confidencial: solo se usa para preparar tu ficha. Los compradores ven las cifras, nunca el documento.</span>
        </p>
      </div>

      <Guide years={years} />

      <div className="grid gap-4 md:grid-cols-3">
        {years.map((year) => (
          <YearSlot
            key={year}
            year={year}
            filing={byYear.get(year)}
            selected={reviewYear === year}
            onUploaded={(filing) => {
              setLocal((current) => ({ ...current, [year]: filing }));
              setNotice(null);
              setReviewYear(year);
            }}
            onReview={() => {
              setNotice(null);
              setReviewYear(year);
            }}
          />
        ))}
      </div>

      {notice ? (
        <p className="rounded-xl bg-[#e6f4ef] px-4 py-3 text-sm text-[#1f7a5a]" role="status">
          {notice}
        </p>
      ) : null}

      {reviewing ? (
        <ReviewPanel
          key={`${reviewing.year}-${reviewing.updatedAt}`}
          filing={reviewing}
          onClose={() => setReviewYear(null)}
          onConfirmed={() => {
            setNotice(`Cifras de ${reviewing.year} confirmadas. Ya aparecen en tu ficha.`);
            setReviewYear(null);
          }}
        />
      ) : null}

      {confirmed.length > 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-[#1c2740]">Resumen confirmado</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="text-left text-xs text-[#5c6b78]">
                  <th className="pb-2 font-medium">Ejercicio</th>
                  <th className="pb-2 text-right font-medium">Ventas</th>
                  <th className="pb-2 text-right font-medium">EBITDA</th>
                  <th className="pb-2 text-right font-medium">Margen EBITDA</th>
                  <th className="pb-2 text-right font-medium">Liquidez</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f3]">
                {confirmed
                  .slice()
                  .sort((a, b) => b.year - a.year)
                  .map((filing) => {
                    const values = Object.fromEntries(
                      Object.entries(filing.extraction?.amounts ?? {}).map(([key, field]) => [key, field?.value ?? null]),
                    ) as YearAmounts;
                    const r = yearRatios(values);
                    return (
                      <tr key={filing.year} className="tabular-nums text-[#1c2740]">
                        <td className="py-2">{filing.year}</td>
                        <td className="py-2 text-right">{values.sales == null ? "—" : euros.format(values.sales)}</td>
                        <td className="py-2 text-right">{r.ebitda === null ? "—" : euros.format(r.ebitda)}</td>
                        <td className="py-2 text-right">{r.ebitdaMargin === null ? "—" : percent.format(r.ebitdaMargin)}</td>
                        <td className="py-2 text-right">{r.liquidity === null ? "—" : ratio.format(r.liquidity)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {growth !== null ? (
            <p className="mt-3 text-sm text-[#5c6b78]">
              Crecimiento anual de ventas: <strong className="font-semibold text-[#1c2740]">{percent.format(growth)}</strong>
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
