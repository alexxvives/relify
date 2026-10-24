"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, FileSignature, FileText, PenLine, Upload } from "lucide-react";
import { FilePreviewDialog, useModalScrollLock } from "@/components/file-preview-dialog";
import { PdfPages } from "@/components/pdf-pages";
import { SignaturePad } from "@/components/signature-pad";
import {
  reviewContractAction,
  signContractAction,
  uploadContractAction,
  type ContractActionState,
} from "@/app/procesos/contract-actions";
import { contractStatusLabel, type ContractStage as Stage, type ContractView } from "@/lib/sale-contract";

const stageOrder: { id: Stage; label: string }[] = [
  { id: "upload", label: "Subir contrato" },
  { id: "review", label: "Revisión del comprador" },
  { id: "signing", label: "Firmas" },
  { id: "signed", label: "Venta cerrada" },
];

function stageIndex(stage: Stage): number {
  return stage === "changes" ? 0 : stageOrder.findIndex((item) => item.id === stage);
}

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" }).format(new Date(iso));
}

function Feedback({ state }: { state: ContractActionState }) {
  if (!state) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-[#17663a]" : "text-[#c0362c]"}`}>
      {state.message}
    </p>
  );
}

/** "Contrato de compraventa" panel shown in the documents stage of a process. */
export function ContractStage({ contract }: { contract: ContractView }) {
  const [preview, setPreview] = useState<{ fileName: string; href: string } | null>(null);
  const [signing, setSigning] = useState(false);
  const current = contract.current;
  const active = stageIndex(contract.stage);
  const yours = contract.next.who === "you";

  return (
    <section aria-labelledby={`contract-${contract.accessId}`} className="rounded-2xl border border-[#dfe5f5] bg-[#f8f9fe] px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`contract-${contract.accessId}`} className="flex items-center gap-2 text-base font-semibold text-[#1c2740]">
          <FileSignature aria-hidden className="size-5 text-[#465ab4]" />
          Contrato de compraventa
        </h3>
        {current ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#3d4a63] ring-1 ring-[#e1e6f0]">
            Versión {current.version} · {contractStatusLabel[current.status]}
          </span>
        ) : null}
      </div>

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Estado del contrato">
        {stageOrder.map((item, index) => {
          const done = index < active || contract.stage === "signed";
          const now = index === active && contract.stage !== "signed";
          return (
            <li
              key={item.id}
              aria-current={now ? "step" : undefined}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                done ? "bg-[#e7f4ec] text-[#17663a]" : now ? "bg-white font-semibold text-[#1c2740] ring-2 ring-[#465ab4]" : "bg-white/60 text-[#8a96a3]"
              }`}
            >
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs ${done ? "bg-[#17663a] text-white" : now ? "bg-[#465ab4] text-white" : "bg-[#e5e9ef] text-[#5c6b78]"}`}>
                {done ? <Check aria-hidden className="size-3" /> : index + 1}
              </span>
              {item.label}
            </li>
          );
        })}
      </ol>

      <div
        className={`mt-4 flex items-start gap-3 rounded-xl px-4 py-3 ${yours ? "bg-[#fff4e5] text-[#7a4100]" : contract.stage === "signed" ? "bg-[#e7f4ec] text-[#17663a]" : "bg-white text-[#3d4a63]"}`}
      >
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.12em] uppercase ${yours ? "bg-[#fde8e8] text-[#b42318]" : "bg-[#eef1f8] text-[#465ab4]"}`}>
          {yours ? "Tu turno" : contract.stage === "signed" ? "Hecho" : "Qué sigue"}
        </span>
        <p className="pt-0.5 text-base leading-6">{contract.next.text}</p>
      </div>

      {current ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-[#e7eaee]">
          <FileText aria-hidden className="size-5 shrink-0 text-[#5c6b78]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-[#1c2740]">{current.fileName}</p>
            <p className="text-sm text-[#5c6b78]">
              Precio final {current.price} · subido el {shortDate(current.uploadedAt)}
              {current.sellerSignedAt ? " · firmado por el vendedor" : ""}
              {current.buyerSignedAt ? " · firmado por el comprador" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreview({ fileName: current.fileName, href: current.href })}
            className="inline-flex h-10 items-center rounded-full border border-[#c9d2f5] bg-white px-4 text-sm font-medium text-[#465ab4]"
          >
            Ver contrato
          </button>
          {contract.signedHref ? (
            <a href={`${contract.signedHref}&download=1`} className="inline-flex h-10 items-center rounded-full bg-[#17663a] px-4 text-sm font-semibold text-white">
              Descargar contrato firmado
            </a>
          ) : null}
          {contract.can.sign ? (
            <button
              type="button"
              onClick={() => setSigning(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white"
            >
              <PenLine aria-hidden className="size-4" />
              Firmar contrato
            </button>
          ) : null}
        </div>
      ) : null}

      {contract.can.review && current ? <ReviewForm contractId={current.id} /> : null}
      {contract.can.upload ? <UploadForm accessId={contract.accessId} first={!current} /> : null}

      {contract.versions.length > 1 ? (
        <details className="mt-4 rounded-xl bg-white px-4 py-3 ring-1 ring-[#e7eaee]">
          <summary className="cursor-pointer text-sm font-medium text-[#3d4a63]">Historial de versiones ({contract.versions.length})</summary>
          <ul className="mt-3 flex flex-col gap-3">
            {contract.versions.map((version) => (
              <li key={version.id} className="flex flex-wrap items-start justify-between gap-2 border-t border-[#eef0f3] pt-3 text-sm first:border-0 first:pt-0">
                <div className="min-w-0">
                  <p className="font-medium text-[#1c2740]">
                    Versión {version.version} · {contractStatusLabel[version.status]}
                  </p>
                  <p className="text-[#5c6b78]">
                    {version.uploadedBy} · {shortDate(version.uploadedAt)}
                  </p>
                  {version.comment ? <p className="mt-1 text-[#3d4a63]">Comentario del comprador: “{version.comment}”</p> : null}
                </div>
                <button type="button" onClick={() => setPreview({ fileName: version.fileName, href: version.href })} className="text-sm font-medium text-[#465ab4] underline">
                  Ver
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <FilePreviewDialog file={preview ? { ...preview, folder: "Contrato" } : null} onClose={() => setPreview(null)} />
      {signing && current ? (
        <SignContractDialog contractId={current.id} href={current.href} fileName={current.fileName} price={current.price} onClose={() => setSigning(false)} />
      ) : null}
    </section>
  );
}

function UploadForm({ accessId, first }: { accessId: string; first: boolean }) {
  const [state, action, pending] = useActionState(uploadContractAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-4 flex flex-col gap-3 rounded-xl bg-white px-4 py-4 ring-1 ring-[#e7eaee]">
      <input type="hidden" name="accessId" value={accessId} />
      <p className="text-base font-medium text-[#1c2740]">{first ? "Subir el contrato" : "Subir una versión nueva"}</p>
      <label className="flex flex-col gap-1 text-sm text-[#3d4a63]">
        Archivo PDF del contrato (máximo 7 MB)
        <input
          type="file"
          name="file"
          accept="application/pdf,.pdf"
          required
          className="text-base file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-[#eef1f8] file:px-4 file:text-sm file:font-medium file:text-[#465ab4]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[#3d4a63]">
        Precio final acordado (€)
        <input
          name="price"
          inputMode="decimal"
          required
          placeholder="Por ejemplo: 1.250.000"
          className="h-11 max-w-xs rounded-xl border border-[#d5dbe3] px-3 text-base text-[#1c2740]"
        />
        <span className="text-xs text-[#5c6b78]">La comisión de cierre se calcula sobre este precio.</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#465ab4] px-5 text-base font-semibold text-white disabled:opacity-60">
          <Upload aria-hidden className="size-4" />
          {pending ? "Subiendo…" : "Subir contrato"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

function ReviewForm({ contractId }: { contractId: string }) {
  const [state, action, pending] = useActionState(reviewContractAction, null);
  const [asking, setAsking] = useState(false);

  return (
    <form action={action} className="mt-4 flex flex-col gap-3 rounded-xl bg-white px-4 py-4 ring-1 ring-[#e7eaee]">
      <input type="hidden" name="contractId" value={contractId} />
      <p className="text-base font-medium text-[#1c2740]">¿Estás de acuerdo con este contrato?</p>
      {asking ? (
        <label className="flex flex-col gap-1 text-sm text-[#3d4a63]">
          ¿Qué hay que cambiar? Se enviará al vendedor por el chat.
          <textarea name="comment" required minLength={3} maxLength={2000} rows={3} className="rounded-xl border border-[#d5dbe3] px-3 py-2 text-base text-[#1c2740]" />
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {asking ? (
          <>
            <button type="submit" name="decision" value="changes" disabled={pending} className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-base font-semibold text-white disabled:opacity-60">
              {pending ? "Enviando…" : "Enviar cambios"}
            </button>
            <button type="button" onClick={() => setAsking(false)} className="text-sm font-medium text-[#5c6b78]">
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button type="submit" name="decision" value="accept" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#17663a] px-5 text-base font-semibold text-white disabled:opacity-60">
              <Check aria-hidden className="size-4" />
              {pending ? "Guardando…" : "Aceptar contrato"}
            </button>
            <button type="button" onClick={() => setAsking(true)} className="inline-flex h-11 items-center rounded-full border border-[#c9d2f5] bg-white px-5 text-base font-medium text-[#465ab4]">
              Pedir cambios
            </button>
          </>
        )}
        <Feedback state={state} />
      </div>
    </form>
  );
}

function SignContractDialog({ contractId, href, fileName, price, onClose }: { contractId: string; href: string; fileName: string; price: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalScrollLock(true);
  const [state, action, pending] = useActionState(signContractAction, null);
  const [signature, setSignature] = useState("");
  const [needsSignature, setNeedsSignature] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) dialogRef.current?.close();
  }, [state]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(46rem,calc(100%-2rem))] w-[min(44rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 text-[#1c2740] open:flex backdrop:bg-[#1c2740]/40"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-4">
        <h2 className="text-lg font-semibold">Firmar contrato de compraventa</h2>
        <form method="dialog">
          <button type="submit" className="text-sm font-medium text-[#5c6b78]">
            Cerrar
          </button>
        </form>
      </div>
      <form
        action={action}
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          if (signature.length === 0) {
            event.preventDefault();
            setNeedsSignature(true);
          }
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6f9] px-5 py-4">
          <p className="mb-3 text-sm text-[#3d4a63]">
            {fileName} · precio final {price}. Al firmar aceptas este documento; cuando firmen las dos partes la compraventa queda cerrada.
          </p>
          <PdfPages src={href} title={fileName} />
        </div>
        <div className="shrink-0 border-t border-[#eef0f3] px-5 pt-3 pb-1">
          <input type="hidden" name="contractId" value={contractId} />
          <input type="hidden" name="signature" value={signature} />
          <SignaturePad
            invalid={needsSignature}
            onChange={(value) => {
              setSignature(value);
              if (value.length > 0) setNeedsSignature(false);
            }}
          />
          {needsSignature ? (
            <p role="alert" className="mt-2 text-sm text-[#c0362c]">
              Dibuja tu firma en el recuadro.
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#eef0f3] px-5 py-4">
          {state && !state.ok ? <Feedback state={state} /> : null}
          <button type="submit" disabled={pending} className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-base font-semibold text-white disabled:opacity-60">
            {pending ? "Firmando…" : "Firmar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
