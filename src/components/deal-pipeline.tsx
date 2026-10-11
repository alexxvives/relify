"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Check, ShieldCheck } from "lucide-react";
import { FilePreviewDialog, fileHref, useModalScrollLock } from "@/components/file-preview-dialog";
import { FileTextIcon } from "@/components/ui/file-text";
import { FolderOpenIcon } from "@/components/ui/folder-open";
import { acceptNdaAction, postInvestorMessageAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { acceptSellerLoiAction } from "@/app/mi-empresa/procesos/actions";
import { passDiligenceAction } from "@/app/procesos/pass-action";
import { AgreementSheet } from "@/components/agreement-sheet";
import { attachmentNames } from "@/lib/meeting";
import { accessCopy } from "@/lib/access-copy";
import { sellerCopy } from "@/lib/seller-copy";
import { stepCue, type DealStep, type ProcessFile } from "@/lib/deal-pipeline";

function signTarget(id: DealStep["id"] | undefined, yours: boolean, role: "investor" | "seller"): "nda" | "loi" | null {
  if (id === "nda" && yours) {
    return "nda";
  }

  if (id === "loi" && yours) {
    return "loi";
  }

  if (id === "qa" && role === "investor") {
    return "loi";
  }

  return null;
}

export function DealPipeline({
  steps,
  role,
  onDark = false,
  sign,
  diligence,
  acceptLoi,
  hideAsideCue = false,
  hideQaNote = false,
  hideWaitingCue = false,
}: {
  steps: DealStep[];
  role: "investor" | "seller";
  onDark?: boolean;
  sign?: { slug: string; nda: string; loi: string };
  diligence?: { accessId: string; advisorHref: string };
  acceptLoi?: { accessId: string; body: string };
  hideAsideCue?: boolean;
  hideQaNote?: boolean;
  hideWaitingCue?: boolean;
}) {
  const [signKind, setSignKind] = useState<"nda" | "loi" | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const current = steps.find((step) => step.state === "current");
  const cue = current ? stepCue(current.id, role, current.pendingLoi === true) : { yours: false, action: "La compraventa está hecha." };
  const signKindFor = current?.pendingLoi ? null : signTarget(current?.id, cue.yours, role);
  const canSign = Boolean(sign) && signKindFor !== null;
  const canAccept = role === "seller" && current?.pendingLoi === true && acceptLoi !== undefined && acceptLoi.body.length > 0;
  const currentIndex = steps.findIndex((step) => step.state === "current");
  const count = Math.max(steps.length, 1);
  const edge = `calc(100% / ${count * 2})`;
  const fillSteps = currentIndex < 0 ? count - 1 : currentIndex;
  const showDiligence = current?.id === "diligence" && diligence !== undefined;
  const parkCue = hideAsideCue && !showDiligence && !cue.yours && !canAccept && current !== undefined;
  const parkYourTurn = hideAsideCue && cue.yours && !canAccept && role === "investor";
  const hideQa = hideQaNote && current?.id === "qa" && !current.pendingLoi;

  return (
    <div>
      <div className="layout-table px-1 pt-6 pb-2">
        <ol className="layout-track relative mx-auto items-start" aria-label="Recorrido del proceso">
          <span
            className={onDark ? "absolute top-3 h-1 rounded-full bg-white/20" : "absolute top-3 h-1 rounded-full bg-[#e6eaf2]"}
            style={{ left: edge, right: edge }}
            aria-hidden
          />
          <span
            className={onDark ? "absolute top-3 h-1 rounded-full bg-[#8dffc4]" : "absolute top-3 h-1 rounded-full bg-[#178a45]"}
            style={{ left: edge, width: `calc(100% * ${fillSteps} / ${count})` }}
            aria-hidden
          />
          {steps.map((step) => {
            const labelClass =
              step.state === "current"
                ? onDark
                  ? "rounded-full bg-white/15 px-2 py-0.5 text-center text-[11px] font-semibold text-white"
                  : "rounded-full bg-[#e8f6ee] px-2 py-0.5 text-center text-[11px] font-semibold text-[#17663a]"
                : step.state === "done"
                  ? onDark
                    ? "text-center text-[11px] font-medium text-[#b8ffd8]"
                    : "text-center text-[11px] font-medium text-[#17663a]"
                  : onDark
                    ? "text-center text-[11px] text-white/55"
                    : "text-center text-[11px] text-[#8b95a7]";

            return (
              <li
                key={step.id}
                aria-current={step.state === "current" ? "step" : undefined}
                className="min-w-0"
              >
                <span className="relative z-10 flex h-7 items-center justify-center">
                  <StepDot state={step.state} onDark={onDark} />
                </span>
                <StepHint label={step.label} text={step.detail} className={labelClass} />
              </li>
            );
          })}
        </ol>
      </div>
      {showDiligence && diligence ? (
        <DiligenceChoice accessId={diligence.accessId} advisorHref={diligence.advisorHref} onDark={onDark} hideWaitingCue={hideWaitingCue} />
      ) : parkCue || parkYourTurn || hideQa ? null : (
        <TurnCue
          cue={cue}
          onDark={onDark}
          center={hideWaitingCue}
          canSign={canSign}
          canAccept={canAccept}
          onSign={() => {
            if (signKindFor) {
              setSignKind(signKindFor);
            }
          }}
          onAccept={() => {
            setAcceptOpen(true);
          }}
        />
      )}
      {acceptLoi && acceptOpen ? (
        <AcceptLoiDialog
          accessId={acceptLoi.accessId}
          body={acceptLoi.body}
          onClose={() => {
            setAcceptOpen(false);
          }}
        />
      ) : null}
      {sign && signKind ? (
        <ProcessSignDialog
          kind={signKind}
          slug={sign.slug}
          agreement={signKind === "nda" ? sign.nda : sign.loi}
          onClose={() => {
            setSignKind(null);
          }}
        />
      ) : null}
    </div>
  );
}

function TurnCue({
  cue,
  onDark,
  center,
  canSign,
  canAccept,
  onSign,
  onAccept,
}: {
  cue: { yours: boolean; action: string };
  onDark: boolean;
  center: boolean;
  canSign: boolean;
  canAccept: boolean;
  onSign: () => void;
  onAccept: () => void;
}) {
  if (cue.yours) {
    const frame = center
      ? onDark
        ? "mx-auto mt-4 flex w-full max-w-xl items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-center shadow-lg"
        : "mx-auto mt-4 flex w-full max-w-xl items-center justify-center gap-3 rounded-2xl border border-[#f3c4c4] bg-[#fff5f5] px-4 py-3 text-center"
      : onDark
        ? "mx-auto mt-4 flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-lg"
        : "mx-auto mt-4 flex max-w-xl items-center gap-3 rounded-2xl border border-[#f3c4c4] bg-[#fff5f5] px-4 py-3 text-left";

    return (
      <div className={frame}>
        <span className="relative flex size-3 shrink-0" aria-hidden>
          <span className="deal-pulse absolute inset-0 rounded-full bg-[#d92d20]" />
          <span className="relative size-3 rounded-full bg-[#d92d20]" />
        </span>
        <span className={center ? "min-w-0" : "min-w-0 flex-1"}>
          <span className="block text-xs font-semibold tracking-[0.14em] text-[#b42318] uppercase">Tu turno</span>
          <span className="mt-0.5 block text-sm text-[#1c2740]">{cue.action}</span>
        </span>
        {canAccept ? <AcceptNow onAccept={onAccept} /> : null}
        {canSign ? <SignNow onSign={onSign} /> : null}
      </div>
    );
  }

  if (center) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-center">
        <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#17663a] uppercase">
          Qué sigue
        </span>
        <p className={onDark ? "text-sm leading-5 text-white" : "text-sm leading-5 text-[#3d4a63]"}>{cue.action}</p>
        {canAccept ? <AcceptNow onAccept={onAccept} /> : null}
        {canSign ? <SignNow onSign={onSign} /> : null}
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-start justify-between gap-3">
      {onDark ? (
        <div className="flex min-w-0 items-start gap-3">
          <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#17663a] uppercase">
            Qué sigue
          </span>
          <p className="pt-0.5 text-sm leading-5 text-white">{cue.action}</p>
        </div>
      ) : (
        <DealWaitingCue cue={cue} className="min-w-0 flex-1" />
      )}
      {canAccept ? <AcceptNow onAccept={onAccept} /> : null}
      {canSign ? <SignNow onSign={onSign} /> : null}
    </div>
  );
}

function AcceptNow({ onAccept }: { onAccept: () => void }) {
  return (
    <button
      type="button"
      onClick={onAccept}
      className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#465ab4] px-3 text-sm font-semibold text-white"
    >
      Aceptar carta
    </button>
  );
}

function SignNow({ onSign }: { onSign: () => void }) {
  return (
    <button
      type="button"
      onClick={onSign}
      className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#17663a] px-3 text-sm font-semibold text-white"
    >
      Firmar ahora
    </button>
  );
}

export function ProcessHeaderCue({
  steps,
  role,
  sign,
}: {
  steps: DealStep[];
  role: "investor" | "seller";
  sign?: { slug: string; nda: string; loi: string };
}) {
  const [signKind, setSignKind] = useState<"nda" | "loi" | null>(null);
  const current = steps.find((step) => step.state === "current");
  const cue = current && current.id !== "diligence" ? stepCue(current.id, role, current.pendingLoi === true) : null;
  const signKindFor = current && !current.pendingLoi ? signTarget(current.id, cue?.yours === true, role) : null;
  const canSign = Boolean(sign) && signKindFor !== null;

  if (!cue || (cue.yours && role === "seller")) {
    return null;
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {cue.yours ? (
          <span className="flex min-w-0 items-start gap-3">
            <span className="shrink-0 rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-[#b42318] uppercase">
              Tu turno
            </span>
            <p className="pt-0.5 text-sm leading-5 text-[#1c2740]">{cue.action}</p>
          </span>
        ) : (
          <DealWaitingCue cue={cue} />
        )}
        {canSign && signKindFor ? (
          <SignNow
            onSign={() => {
              setSignKind(signKindFor);
            }}
          />
        ) : null}
      </div>
      {sign && signKind ? (
        <ProcessSignDialog
          kind={signKind}
          slug={sign.slug}
          agreement={signKind === "nda" ? sign.nda : sign.loi}
          onClose={() => {
            setSignKind(null);
          }}
        />
      ) : null}
    </>
  );
}

export function DealWaitingCue({ cue, className = "" }: { cue: { action: string }; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#17663a] uppercase">
        Qué sigue
      </span>
      <p className="pt-0.5 text-sm leading-5 text-[#3d4a63]">{cue.action}</p>
    </div>
  );
}

function DiligenceChoice({
  accessId,
  advisorHref,
  onDark,
  hideWaitingCue,
}: {
  accessId: string;
  advisorHref: string;
  onDark: boolean;
  hideWaitingCue: boolean;
}) {
  const [state, action, pending] = useActionState(passDiligenceAction, null);

  return (
    <div className={onDark ? "mt-4 rounded-2xl bg-white/10 px-4 py-3" : "mt-4 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] px-4 py-3"}>
      <div className="flex items-start gap-3">
        {hideWaitingCue ? null : (
          <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#17663a] uppercase">
            Qué sigue
          </span>
        )}
        <p className={onDark ? "pt-0.5 text-sm leading-5 text-white/85" : "pt-0.5 text-sm leading-5 text-[#3d4a63]"}>
          Revisa con un asesor de Releva, o sigue a la documentación. El contrato lo sube el vendedor.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={advisorHref}
          className="inline-flex h-9 items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4]"
        >
          Contactar con un asesor
        </Link>
        <form action={action}>
          <input type="hidden" name="accessId" value={accessId} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center rounded-full bg-[#17663a] px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Seguir a documentación"}
          </button>
        </form>
      </div>
      {state && !state.ok ? <p className="mt-2 text-sm text-red-700">{state.message}</p> : null}
    </div>
  );
}

function ProcessSignDialog({
  kind,
  slug,
  agreement,
  onClose,
}: {
  kind: "nda" | "loi";
  slug: string;
  agreement: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalScrollLock(true);
  const action = kind === "nda" ? acceptNdaAction : postInvestorMessageAction;
  const [state, formAction, pending] = useActionState(action, null);
  const fileName = kind === "nda" ? "Acuerdo-de-confidencialidad.pdf" : "Carta-de-intenciones.pdf";
  const submitLabel = kind === "nda" ? accessCopy.acceptAction : accessCopy.signLoi;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
    }
  }, [state]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#d5dbe3] bg-[#eef1f4] p-3 text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/45"
      onClose={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-2 py-1">
        <p className="truncate text-sm font-medium text-[#3d4a63]">{fileName}</p>
        <form method="dialog">
          <button type="submit" className="text-sm font-medium text-[#5c6b78]">
            Cerrar
          </button>
        </form>
      </div>
      <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-white shadow-[0_12px_40px_-24px_rgba(28,39,64,0.45)]">
        <AgreementSheet text={agreement} />
      </div>
      <form action={formAction} className="mt-3 flex items-center justify-center gap-3 px-1">
        <input type="hidden" name="slug" value={slug} />
        {kind === "loi" ? (
          <>
            <input type="hidden" name="kind" value="offer" />
            <input type="hidden" name="body" value={agreement} />
          </>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Firmando…" : submitLabel}
        </button>
      </form>
      <SignError state={state} />
    </dialog>
  );
}

function AcceptLoiDialog({ accessId, body, onClose }: { accessId: string; body: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalScrollLock(true);
  const [state, formAction, pending] = useActionState(acceptSellerLoiAction, null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
    }
  }, [state]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#d5dbe3] bg-[#eef1f4] p-3 text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/45"
      onClose={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-2 py-1">
        <p className="truncate text-sm font-medium text-[#3d4a63]">Carta-de-intenciones.pdf</p>
        <form method="dialog">
          <button type="submit" className="text-sm font-medium text-[#5c6b78]">
            Cerrar
          </button>
        </form>
      </div>
      <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-white shadow-[0_12px_40px_-24px_rgba(28,39,64,0.45)]">
        <AgreementSheet text={body} />
      </div>
      <form action={formAction} className="mt-3 flex items-center justify-center px-1">
        <input type="hidden" name="accessId" value={accessId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Aceptando…" : "Aceptar carta"}
        </button>
      </form>
      {state && !state.ok ? (
        <p className="mt-2 px-1 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
    </dialog>
  );
}

function SignError({ state }: { state: ProjectAccessActionState }) {
  if (!state || state.ok) {
    return null;
  }

  return (
    <p className="mt-2 px-1 text-sm text-red-700" role="alert">
      {state.message}
    </p>
  );
}

function StepHint({ label, text, className }: { label: string; text: string; className: string }) {
  const [box, setBox] = useState<{ x: number; y: number } | null>(null);

  function place(target: HTMLButtonElement) {
    const rect = target.getBoundingClientRect();
    setBox({ x: rect.left + rect.width / 2, y: rect.top });
  }

  return (
    <>
      <button
        type="button"
        className={`w-full cursor-help border-0 bg-transparent p-0 break-words whitespace-normal ${className}`}
        onMouseEnter={(event) => {
          place(event.currentTarget);
        }}
        onMouseLeave={() => {
          setBox(null);
        }}
        onFocus={(event) => {
          place(event.currentTarget);
        }}
        onBlur={() => {
          setBox(null);
        }}
      >
        {label}
      </button>
      {box
        ? createPortal(
            <span
              role="tooltip"
              style={{ left: box.x, top: box.y - 8 }}
              className="pointer-events-none fixed z-[80] w-72 -translate-x-1/2 -translate-y-full rounded-xl bg-[#1c2740] px-3 py-2 text-left text-xs leading-5 font-normal text-white shadow-lg"
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function StepDot({ state, onDark = false }: { state: DealStep["state"]; onDark?: boolean }) {
  if (state === "current") {
    return (
      <span className="relative block size-6 shrink-0">
        <span className="deal-pulse absolute -inset-1 rounded-full bg-[#178a45]" />
        <span className="relative block size-6 rounded-full border-2 border-white bg-[#178a45] shadow-[0_0_0_4px_rgba(23,138,69,0.18)]" />
      </span>
    );
  }

  if (state === "done") {
    return (
      <span
        className={
          onDark
            ? "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#8dffc4] text-[#0d3d24]"
            : "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#17663a] text-white"
        }
      >
        <Check className="size-3.5" aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={
        onDark
          ? "size-6 shrink-0 rounded-full border-2 border-white/45 bg-[#121826]"
          : "size-6 shrink-0 rounded-full border-2 border-[#d5dbe3] bg-white"
      }
    />
  );
}

function FileButton({ folder, fileName, onOpen }: { folder: string; fileName: string; onOpen: (file: ProcessFile) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onOpen({ folder, fileName });
        }}
        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-[#1c2740] hover:bg-white"
      >
        <FolderOpenIcon size={16} className="shrink-0 text-[#465ab4]" aria-hidden />
        <span className="min-w-0 truncate">{fileName}</span>
      </button>
    </li>
  );
}

export function ProcessDocuments({
  files,
  empty,
  onOpen,
}: {
  files: ProcessFile[];
  empty: string;
  onOpen: (file: ProcessFile) => void;
}) {
  if (files.length === 0) {
    return <p className="text-sm leading-6 text-[#667085]">{empty}</p>;
  }

  const folders = [...new Set(files.map((file) => file.folder))];

  return (
    <ul className="flex flex-col gap-4">
      {folders.map((folder) => (
        <li key={folder}>
          <p className="text-xs font-semibold tracking-wide text-[#5c6b78] uppercase">{folder}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {files
              .filter((file) => file.folder === folder)
              .map((file) => (
                <FileButton key={`${folder}-${file.fileName}`} folder={folder} fileName={file.fileName} onOpen={onOpen} />
              ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function SignBubble({
  fileName,
  body,
  children,
}: {
  fileName: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#465ab4]/35 bg-[#eef1ff] p-4 shadow-[0_10px_28px_rgba(70,90,180,0.14)]">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#465ab4] uppercase">Te toca firmar</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#1c2740]">
        <FileTextIcon size={16} className="shrink-0 text-[#465ab4]" aria-hidden />
        <span className="min-w-0 truncate">{fileName}</span>
      </p>
      <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{body}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function ProcessRoom({
  files,
  bodies,
  nda,
  empty,
  prompt = null,
}: {
  files: ProcessFile[];
  bodies: readonly string[];
  nda: boolean;
  empty: string;
  prompt?: ReactNode;
}) {
  const held = files.filter((file) => file.stored === true);
  const shared = held.filter((file) => file.visible !== false);
  const hidden = held.filter((file) => file.visible === false);
  const sent = attachmentNames(bodies);
  const bare = shared.length === 0 && hidden.length === 0 && sent.length === 0 && !nda;
  const [openFile, setOpenFile] = useState<ProcessFile | null>(null);
  const other = nda || hidden.length > 0 || sent.length > 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">
      <h3 className="text-sm font-semibold text-[#1c2740]">{sellerCopy.processDocumentsTitle}</h3>
      {prompt ? <div className="mt-4">{prompt}</div> : null}
      {bare && !prompt ? <p className="mt-3 text-sm leading-6 text-[#667085]">{empty}</p> : null}
      {bare ? null : (
      <div className="mt-4 flex-1 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] p-4">
        <p className="text-xs font-semibold tracking-wide text-[#1c2740] uppercase">{sellerCopy.documentsShared}</p>
        <div className="mt-2">
          <ProcessDocuments files={shared} empty={sellerCopy.documentsEmpty} onOpen={setOpenFile} />
        </div>
      </div>
      )}
      {other ? (
        <div className="mt-4 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] p-4">
          <p className="text-xs font-semibold tracking-wide text-[#5c6b78] uppercase">{sellerCopy.documentsOther}</p>
          {nda ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-[#1c2740]">
              <ShieldCheck className="size-4 shrink-0 text-[#17663a]" aria-hidden />
              {sellerCopy.ndaAcceptedRow}
            </p>
          ) : null}
          {hidden.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-[#8b95a7]">{sellerCopy.documentsPrivate}</p>
              <div className="mt-1">
                <ProcessDocuments files={hidden} empty="" onOpen={setOpenFile} />
              </div>
            </div>
          ) : null}
          {sent.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-[#5c6b78]">{sellerCopy.documentsSent}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {sent.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenFile({ folder: sellerCopy.documentsSent, fileName: name });
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-[#1c2740] hover:bg-white"
                    >
                      <FileTextIcon size={16} className="shrink-0 text-[#465ab4]" aria-hidden />
                      <span className="min-w-0 truncate">{name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <FilePreviewDialog
        file={
          openFile
            ? { fileName: openFile.fileName, folder: openFile.folder, href: fileHref(openFile) }
            : null
        }
        onClose={() => {
          setOpenFile(null);
        }}
      />
    </section>
  );
}
