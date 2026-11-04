"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Download, Eye, FileSignature, FileText, PenLine, Upload, X } from "lucide-react";
import { FilePreviewDialog, useModalScrollLock } from "@/components/file-preview-dialog";
import { PdfPages } from "@/components/pdf-pages";
import { SignaturePad } from "@/components/signature-pad";
import {
  reviewContractAction,
  signContractAction,
  uploadContractAction,
  type ContractActionState,
} from "@/app/(app)/procesos/contract-actions";
import { contractStatusLabel, type ContractStage as Stage, type ContractView } from "@/lib/sale-contract";
import { Button, Input, Textarea } from "@/components/ui/form";

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

/**
 * One button in the process header opens the sale contract in a pane: status, what's next, the
 * current file, the action for this user and the full version history.
 */
export function ContractStage({ contract }: { contract: ContractView }) {
  const [open, setOpen] = useState(false);
  const current = contract.current;
  const yours = contract.next.who === "you";
  const signed = contract.stage === "signed";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
          yours ? "bg-[#465ab4] text-white hover:bg-[#3d4fa3]" : "border border-[#c9d2f5] bg-white text-[#465ab4] hover:bg-[#f4f6fb]"
        }`}
      >
        <FileSignature aria-hidden className="size-4" />
        Contrato
        {current ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${yours ? "bg-white/20 text-white" : signed ? "bg-[#e7f4ec] text-[#17663a]" : "bg-[#eef1f8] text-[#465ab4]"}`}>
            {signed ? "Firmado" : `v${current.version}`}
          </span>
        ) : null}
        {yours ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-3" aria-hidden>
            <span className="deal-pulse absolute inset-0 rounded-full bg-[#d92d20]" />
            <span className="relative size-3 rounded-full border-2 border-white bg-[#d92d20]" />
          </span>
        ) : null}
        {yours ? <span className="sr-only">Tienes una acción pendiente</span> : null}
      </button>
      {open ? <ContractPane contract={contract} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ContractPane({ contract, onClose }: { contract: ContractView; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalScrollLock(true);
  const [preview, setPreview] = useState<{ fileName: string; href: string } | null>(null);
  const [signing, setSigning] = useState(false);
  const current = contract.current;
  const active = stageIndex(contract.stage);
  const yours = contract.next.who === "you";
  const signed = contract.stage === "signed";
  const versions = [...contract.versions].sort((x, y) => y.version - x.version);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={`contract-${contract.accessId}`}
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(48rem,calc(100%-2rem))] w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 text-[#1c2740] open:flex backdrop:bg-[#1c2740]/40"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-4">
        <h2 id={`contract-${contract.accessId}`} className="flex items-center gap-2 text-lg font-semibold">
          <FileSignature aria-hidden className="size-5 text-[#465ab4]" />
          Contrato de compraventa
        </h2>
        <form method="dialog">
          <button type="submit" aria-label="Cerrar" className="inline-flex size-10 items-center justify-center rounded-full text-[#5c6b78] hover:bg-[#f4f6fb]">
            <X aria-hidden className="size-5" />
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <ol className="flex items-center gap-1" aria-label="Estado del contrato">
          {stageOrder.map((item, index) => {
            const done = index < active || signed;
            const now = index === active && !signed;
            return (
              <li key={item.id} aria-current={now ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className={`h-1.5 rounded-full ${done ? "bg-[#17663a]" : now ? "bg-[#465ab4]" : "bg-[#e5e9ef]"}`} aria-hidden />
                <span className={`truncate text-sm ${now ? "font-semibold text-[#1c2740]" : done ? "text-[#17663a]" : "text-[#5c6b78]"}`}>{item.label}</span>
              </li>
            );
          })}
        </ol>

        {signed ? null : (
          <div
            className={`mt-5 flex items-start gap-3 rounded-xl px-4 py-3 ${yours ? "bg-[#fff5f5]" : "bg-[#f7f8fb]"}`}
          >
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${yours ? "bg-[#fde8e8] text-[#b42318]" : "bg-[#e8f6ee] text-[#17663a]"}`}>
              {yours ? "Tu turno" : "Qué sigue"}
            </span>
            <p className="pt-0.5 text-base leading-6 text-[#1c2740]">{contract.next.text}</p>
          </div>
        )}

        {current ? (
          <div className="mt-5 rounded-2xl border border-[#e7eaee] p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1f8] text-[#465ab4]">
                <FileText aria-hidden className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{current.fileName}</p>
                <p className="mt-0.5 text-sm text-[#5c6b78]">
                  Versión {current.version} · {contractStatusLabel[current.status]}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm" role="group" aria-label="Firmas">
              <div className="flex items-center gap-2 rounded-xl bg-[#f7f8fb] px-3 py-2">
                <SignedMark done={Boolean(current.sellerSignedAt)} />
                <span>Vendedor</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#f7f8fb] px-3 py-2">
                <SignedMark done={Boolean(current.buyerSignedAt)} />
                <span>Comprador</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreview({ fileName: current.fileName, href: current.href })}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#c9d2f5] bg-white px-4 text-sm font-medium text-[#465ab4]"
              >
                <Eye aria-hidden className="size-4" />
                Ver contrato
              </button>
              {contract.signedHref ? (
                <a href={`${contract.signedHref}&download=1`} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#17663a] px-4 text-sm font-semibold text-white">
                  <Download aria-hidden className="size-4" />
                  Descargar firmado
                </a>
              ) : null}
              {contract.can.sign ? (
                <button
                  type="button"
                  onClick={() => setSigning(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white"
                >
                  <PenLine aria-hidden className="size-4" />
                  Firmar contrato
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {contract.can.review && current ? <ReviewForm contractId={current.id} /> : null}
        {contract.can.upload ? <UploadForm accessId={contract.accessId} first={!current} /> : null}

        {versions.length > 0 ? (
          <section className="mt-6" aria-label="Versiones">
            <h3 className="text-base font-semibold">Versiones</h3>
            <ol className="mt-3 flex flex-col">
              {versions.map((version, index) => (
                <li key={version.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < versions.length - 1 ? <span className="absolute top-7 bottom-0 left-[13px] w-px bg-[#e5e9ef]" aria-hidden /> : null}
                  <span
                    className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      index === 0 ? "bg-[#465ab4] text-white" : "bg-[#eef1f8] text-[#5c6b78]"
                    }`}
                  >
                    {version.version}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {contractStatusLabel[version.status]}
                        {index === 0 ? <span className="ml-2 font-normal text-[#5c6b78]">· actual</span> : null}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPreview({ fileName: version.fileName, href: version.href })}
                        className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-[#465ab4] hover:bg-[#f4f6fb]"
                      >
                        Ver
                      </button>
                    </div>
                    <p className="text-sm text-[#5c6b78]">
                      {version.uploadedBy} · {shortDate(version.uploadedAt)}
                    </p>
                    {version.comment ? (
                      <p className="mt-2 rounded-xl bg-[#f7f8fb] px-3 py-2 text-sm text-[#3d4a63]">“{version.comment}”</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>

      <FilePreviewDialog file={preview ? { ...preview, folder: "Contrato" } : null} onClose={() => setPreview(null)} />
      {signing && current ? (
        <SignContractDialog contractId={current.id} href={current.href} fileName={current.fileName} price={current.price} onClose={() => setSigning(false)} />
      ) : null}
    </dialog>
  );
}

function SignedMark({ done }: { done: boolean }) {
  return done ? (
    <span className="flex size-5 items-center justify-center rounded-full bg-[#17663a] text-white">
      <Check aria-hidden className="size-3" />
      <span className="sr-only">Firmado</span>
    </span>
  ) : (
    <span className="size-5 rounded-full border-2 border-dashed border-[#c5ccd6]">
      <span className="sr-only">Sin firmar</span>
    </span>
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
        <Input
          name="price"
          inputMode="decimal"
          required
          placeholder="Por ejemplo: 1.250.000"
          className="max-w-xs"
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
          <Textarea name="comment" required minLength={3} maxLength={2000} rows={3} />
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {asking ? (
          <>
            <Button type="submit" name="decision" value="changes" disabled={pending} className="rounded-full px-5 font-semibold">
              {pending ? "Enviando…" : "Enviar cambios"}
            </Button>
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
          <Button type="submit" disabled={pending} className="rounded-full px-5 font-semibold">
            {pending ? "Firmando…" : "Firmar contrato"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
