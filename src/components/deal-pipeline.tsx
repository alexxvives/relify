"use client";

import { PdfPages } from "@/components/pdf-pages";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Check, CircleHelp, Phone, ShieldCheck, X } from "lucide-react";
import { AgreementDocument } from "@/components/agreement-document";
import { shellCopy } from "@/lib/shell";
import { documentDeskClass, documentDeskHeaderClass, FilePreviewDialog, fileHref, useModalScrollLock } from "@/components/file-preview-dialog";
import { FileTextIcon } from "@/components/ui/file-text";
import { FolderOpenIcon } from "@/components/ui/folder-open";
import { acceptNdaAction, postInvestorMessageAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { SignaturePad } from "@/components/signature-pad";
import { platformTermsCopy } from "@/lib/platform-terms";
import { acceptSellerLoiAction } from "@/app/(app)/mi-empresa/procesos/actions";
import { passDiligenceAction } from "@/app/(app)/procesos/pass-action";
import { attachmentNames } from "@/lib/meeting";
import { accessCopy } from "@/lib/access-copy";
import { sellerCopy } from "@/lib/seller-copy";
import { stepCue, type DealStep, type DealViewer, type ProcessFile } from "@/lib/deal-pipeline";
import { Button } from "@/components/ui/form";

const loiReadyEvent = "Relify-loi-ready";

function useLoiReady(slug: string | undefined): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function onReady(event: Event) {
      if (event instanceof CustomEvent && event.detail === slug) {
        setReady(true);
      }
    }

    window.addEventListener(loiReadyEvent, onReady);
    return () => window.removeEventListener(loiReadyEvent, onReady);
  }, [slug]);

  return ready;
}

function proceedToLoi(slug: string) {
  window.dispatchEvent(new CustomEvent(loiReadyEvent, { detail: slug }));
}

function signTarget(id: DealStep["id"] | undefined, yours: boolean, role: DealViewer): "nda" | "loi" | null {
  if (id === "nda" && yours) {
    return "nda";
  }

  if (id === "loi" && yours) {
    return "loi";
  }

  if (id === "qa" && role === "investor") {
    return null;
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
  role: DealViewer;
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
  const loiReady = useLoiReady(sign?.slug);
  const previewLoi = loiReady && steps.some((step) => step.id === "qa" && step.state === "current" && !step.pendingLoi);
  const shownSteps = previewLoi
    ? steps.map((step) =>
        step.id === "qa" ? { ...step, state: "done" as const } : step.id === "loi" ? { ...step, state: "current" as const } : step,
      )
    : steps;
  const current = shownSteps.find((step) => step.state === "current");
  const cue = current ? stepCue(current.id, role, current.pendingLoi === true) : { yours: false, action: "La compraventa está hecha." };
  const signKindFor = current?.pendingLoi ? null : signTarget(current?.id, cue.yours, role);
  const canSign = Boolean(sign) && signKindFor !== null;
  const canAccept = role === "seller" && current?.pendingLoi === true && acceptLoi !== undefined && acceptLoi.body.length > 0;
  const currentIndex = shownSteps.findIndex((step) => step.state === "current");
  const count = Math.max(shownSteps.length, 1);
  const edge = `calc(100% / ${count * 2})`;
  const fillSteps = currentIndex < 0 ? count - 1 : currentIndex;
  const showDiligence = current?.id === "diligence" && diligence !== undefined && !hideAsideCue;
  const parkCue = hideAsideCue && !showDiligence && !cue.yours && !canAccept;
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
          {shownSteps.map((step) => {
            const labelClass =
              step.state === "current"
                ? onDark
                  ? "rounded-full bg-white px-3 py-1 text-center text-sm font-semibold text-[#1c2740] shadow-sm"
                  : "rounded-full bg-[#e8f6ee] px-3 py-1 text-center text-sm font-semibold text-[#17663a]"
                : step.state === "done"
                  ? onDark
                    ? "text-center text-xs font-medium text-[#b8ffd8]"
                    : "text-center text-xs font-medium text-[#17663a]"
                  : onDark
                    ? "text-center text-xs text-white/80"
                    : "text-center text-xs text-[#5c6b78]";

            return (
              <li
                key={step.id}
                aria-current={step.state === "current" ? "step" : undefined}
                className="min-w-0"
              >
                <span className="relative z-10 flex h-7 items-center justify-center">
                  <StepDot state={step.state} onDark={onDark} />
                </span>
                <span className="max-sm:hidden">
                  <StepHint label={step.label} text={step.detail} className={labelClass} />
                </span>
              </li>
            );
          })}
        </ol>
        {(() => {
          // On phones the eight labels cannot fit side by side, so only the current step is named.
          const focus = current ?? shownSteps[shownSteps.length - 1];
          if (!focus) return null;
          const position = shownSteps.indexOf(focus) + 1;
          return (
            <p className={`mt-3 flex items-center justify-center gap-2 text-sm sm:hidden ${onDark ? "text-white/80" : "text-[#5c6b78]"}`}>
              <span className="tabular-nums">
                Paso {position} de {shownSteps.length}
              </span>
              <span aria-hidden>·</span>
              <StepHint
                label={focus.label}
                text={focus.detail}
                className={onDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-[#17663a]"}
              />
            </p>
          );
        })()}
      </div>
      {showDiligence && diligence ? (
        <DiligenceChoice accessId={diligence.accessId} advisorHref={diligence.advisorHref} onDark={onDark} hideWaitingCue={hideWaitingCue} />
      ) : parkCue || parkYourTurn || hideQa ? null : (
        <TurnCue
          cue={cue}
          onDark={onDark}
          center={hideWaitingCue}
          canSign={canSign}
          signKind={signKindFor}
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

/** When it is the user's turn, offer a phone call right where they have to act. */
function HelpCall({ onDark }: { onDark: boolean }) {
  return (
    <a
      href={shellCopy.helpPhoneHref}
      className={
        onDark
          ? "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/40 px-4 text-sm font-medium text-white hover:bg-white/10"
          : "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#e7eaee] bg-white px-4 text-sm font-medium text-[#1c2740] hover:bg-[#f4f6fb]"
      }
    >
      <Phone className="size-4" aria-hidden />
      {shellCopy.helpCall} {shellCopy.helpPhone}
    </a>
  );
}

function TurnCue({
  cue,
  onDark,
  center,
  canSign,
  signKind,
  canAccept,
  onSign,
  onAccept,
}: {
  cue: { yours: boolean; action: string };
  onDark: boolean;
  center: boolean;
  canSign: boolean;
  signKind: "nda" | "loi" | null;
  canAccept: boolean;
  onSign: () => void;
  onAccept: () => void;
}) {
  if (cue.yours) {
    if (onDark) {
      return (
        <div
          className={
            center
              ? "mt-4 flex flex-wrap items-center justify-center gap-3 text-center"
              : "mx-auto mt-4 flex max-w-xl flex-wrap items-center gap-3 text-left"
          }
        >
          <span className="shrink-0 rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs leading-5 font-semibold text-[#b42318]">
            Tu turno
          </span>
          <span className="text-sm leading-5 text-white">{cue.action}</span>
          {canAccept ? <AcceptNow onAccept={onAccept} /> : null}
          {canSign ? <SignNow onSign={onSign} kind={signKind} /> : null}
          <HelpCall onDark />
        </div>
      );
    }

    const frame = center
      ? "mx-auto mt-4 flex w-full max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#f3c4c4] bg-[#fff5f5] px-4 py-3 text-center"
      : "mx-auto mt-4 flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border border-[#f3c4c4] bg-[#fff5f5] px-4 py-3 text-left";

    return (
      <div className={frame}>
        <span className="relative flex size-3 shrink-0" aria-hidden>
          <span className="deal-pulse absolute inset-0 rounded-full bg-[#d92d20]" />
          <span className="relative size-3 rounded-full bg-[#d92d20]" />
        </span>
        <span className={center ? "min-w-0" : "min-w-0 flex-1"}>
          <span className="block text-xs font-semibold text-[#b42318]">Tu turno</span>
          <span className="mt-0.5 block text-sm text-[#1c2740]">{cue.action}</span>
        </span>
        {canAccept ? <AcceptNow onAccept={onAccept} /> : null}
        {canSign ? <SignNow onSign={onSign} kind={signKind} /> : null}
        <HelpCall onDark={false} />
      </div>
    );
  }

  if (center) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-center">
        <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-xs leading-5 font-semibold text-[#17663a]">
          Qué sigue
        </span>
        <p className={onDark ? "text-sm leading-5 text-white" : "text-sm leading-5 text-[#3d4a63]"}>{cue.action}</p>
        {canAccept ? <AcceptNow onAccept={onAccept} /> : null}
        {canSign ? <SignNow onSign={onSign} kind={signKind} /> : null}
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-start justify-between gap-3">
      {onDark ? (
        <div className="flex min-w-0 items-start gap-3">
          <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-xs leading-5 font-semibold text-[#17663a]">
            Qué sigue
          </span>
          <p className="pt-1 text-sm leading-5 text-white">{cue.action}</p>
        </div>
      ) : (
        <DealWaitingCue cue={cue} className="min-w-0 flex-1" />
      )}
      {canAccept ? <AcceptNow onAccept={onAccept} /> : null}
      {canSign ? <SignNow onSign={onSign} kind={signKind} /> : null}
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

/** t92: the button names what gets signed. */
function SignNow({ onSign, kind }: { onSign: () => void; kind: "nda" | "loi" | null }) {
  return (
    <button
      type="button"
      onClick={onSign}
      className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#17663a] px-3 text-sm font-semibold text-white"
    >
      {kind === "loi" ? "Firmar LOI" : "Firmar NDA"}
    </button>
  );
}

export function ProcessHeaderCue({
  steps,
  role,
  sign,
  diligence,
  contractNext,
}: {
  steps: DealStep[];
  role: "investor" | "seller";
  sign?: { slug: string; nda: string; loi: string };
  diligence?: { accessId: string; advisorHref: string };
  contractNext?: { who: "you" | "other" | "none"; text: string } | null;
}) {
  const [signKind, setSignKind] = useState<"nda" | "loi" | null>(null);
  const loiReady = useLoiReady(sign?.slug);
  const previewLoi = loiReady && steps.some((step) => step.id === "qa" && step.state === "current" && !step.pendingLoi);
  const current = previewLoi
    ? steps.find((step) => step.id === "loi")
    : steps.find((step) => step.state === "current");
  const cue = current ? stepCue(current.id, role, current.pendingLoi === true) : null;
  const signKindFor = current && !current.pendingLoi ? signTarget(current.id, cue?.yours === true, role) : null;
  const canProceed = role === "investor" && !previewLoi && steps.some((step) => step.id === "qa" && step.state === "current" && !step.pendingLoi) && Boolean(sign);
  const canSign = Boolean(sign) && signKindFor !== null;

  if (contractNext && (current?.id === "documents" || current?.id === "close")) {
    return contractNext.who === "you" ? (
      <span className="flex min-w-0 items-start gap-3">
        <span className="shrink-0 rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs leading-5 font-semibold text-[#b42318]">Tu turno</span>
        <p className="pt-1 text-sm leading-5 text-[#1c2740]">{contractNext.text}</p>
      </span>
    ) : (
      <DealWaitingCue cue={{ action: contractNext.text }} />
    );
  }

  if (!current) {
    return <DealWaitingCue cue={{ action: "La compraventa está hecha." }} />;
  }

  if (!cue || (cue.yours && role === "seller" && current?.id !== "diligence")) {
    return null;
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {cue.yours ? (
          <span className="flex min-w-0 items-start gap-3">
            <span className="shrink-0 rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs leading-5 font-semibold text-[#b42318]">
              Tu turno
            </span>
            <p className="pt-1 text-sm leading-5 text-[#1c2740]">{cue.action}</p>
          </span>
        ) : (
          <DealWaitingCue cue={cue} />
        )}
        {canProceed && sign ? (
          <button
            type="button"
            onClick={() => proceedToLoi(sign.slug)}
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#17663a] px-3 text-sm font-semibold text-white"
          >
            Proceder al LOI
          </button>
        ) : null}
        {current?.id === "diligence" && diligence ? (
          <DiligenceChoice accessId={diligence.accessId} advisorHref={diligence.advisorHref} onDark={false} hideWaitingCue inline />
        ) : null}
        {canSign && signKindFor ? (
          <SignNow
            kind={signKindFor}
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

export function DealWaitingCue({
  cue,
  className = "",
  onDark = false,
}: {
  cue: { action: string };
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-xs leading-5 font-semibold text-[#17663a]">
        Qué sigue
      </span>
      <p className={onDark ? "pt-1 text-sm leading-5 text-white" : "pt-1 text-sm leading-5 text-[#3d4a63]"}>{cue.action}</p>
    </div>
  );
}

function DiligenceChoice({
  accessId,
  advisorHref,
  onDark,
  hideWaitingCue,
  inline = false,
}: {
  accessId: string;
  advisorHref: string;
  onDark: boolean;
  hideWaitingCue: boolean;
  inline?: boolean;
}) {
  const [state, action, pending] = useActionState(passDiligenceAction, null);

  return (
    <div className={inline ? "flex min-w-0 flex-wrap items-center gap-3" : onDark ? "mt-4 rounded-2xl bg-white/10 px-4 py-3" : "mt-4 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] px-4 py-3"}>
      <div className="flex min-w-0 items-start gap-3">
        {hideWaitingCue || inline ? null : (
          <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2.5 py-1 text-xs leading-5 font-semibold text-[#17663a]">
            Qué sigue
          </span>
        )}
        {inline ? null : (
          <p className={onDark ? "pt-1 text-sm leading-5 text-white/85" : "pt-1 text-sm leading-5 text-[#3d4a63]"}>
            Revisa con un asesor de Relify, o sigue a la documentación. El contrato lo sube el vendedor.
          </p>
        )}
      </div>
      <div className={inline ? "flex flex-wrap items-center gap-2" : "mt-3 flex flex-wrap items-center gap-2"}>
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
  const [signature, setSignature] = useState("");
  const [needsSignature, setNeedsSignature] = useState(false);
  const fileName = kind === "nda" ? "Acuerdo de confidencialidad" : "Carta de intenciones";
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
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(48rem,calc(100%-2rem))] w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 text-[#1c2740] open:flex backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-3 px-6 pt-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{fileName}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{kind === "nda" ? accessCopy.ndaIntro : accessCopy.loiIntro}</p>
        </div>
        <form method="dialog">
          <button
            type="submit"
            aria-label="Cerrar"
            className="inline-flex size-9 items-center justify-center rounded-lg text-[#5c6b78] hover:bg-[#f2f4f7] hover:text-[#1c2740]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </form>
      </div>
      <form
        action={formAction}
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          if (signature.length === 0) {
            event.preventDefault();
            setNeedsSignature(false);
            window.requestAnimationFrame(() => {
              setNeedsSignature(true);
            });
          }
        }}
      >
        <div className="mx-6 mt-5 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#e7eaee] bg-[#fafbfc] px-5 py-5">
          <AgreementDocument text={agreement} />
        </div>
        {(
          <div className="shrink-0 px-6 pt-4 pb-1">
            <input type="hidden" name="signature" value={signature} />
            <SignaturePad
              invalid={needsSignature}
              onChange={(value) => {
                setSignature(value);
                if (value.length > 0) {
                  setNeedsSignature(false);
                }
              }}
            />
            {needsSignature ? (
              <p role="alert" className="mt-2 text-sm text-[#c0362c]">
                {platformTermsCopy.signRequired}
              </p>
            ) : null}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 pt-3 pb-6">
          <input type="hidden" name="slug" value={slug} />
          {kind === "loi" ? (
            <>
              <input type="hidden" name="kind" value="offer" />
              <input type="hidden" name="body" value={agreement} />
            </>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            className="h-10 rounded-full text-sm font-semibold"
>
            {pending ? "Firmando…" : submitLabel}
          </Button>
        </div>
        <SignError state={state} />
      </form>
    </dialog>
  );
}

function AcceptLoiDialog({ accessId, onClose }: { accessId: string; body: string; onClose: () => void }) {
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
    <dialog ref={dialogRef} className={documentDeskClass} onClose={onClose}>
      <div className={documentDeskHeaderClass}>
        <p className="truncate text-sm font-semibold">Carta-de-intenciones.pdf</p>
        <form method="dialog">
          <button type="submit" className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-[#5c6b78] hover:bg-[#f2f4f7] hover:text-[#1c2740]">
            Cerrar
          </button>
        </form>
      </div>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <PdfPages title="Carta de intenciones" src={`/acuerdos/loi/${accessId}`} />
      </div>
      <form action={formAction} className="flex shrink-0 items-center justify-end border-t border-[#e6e9f0] bg-white px-4 py-3">
        <input type="hidden" name="accessId" value={accessId} />
        <Button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full text-sm font-semibold"
>
          {pending ? "Aceptando…" : "Aceptar carta"}
        </Button>
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
  const [pinned, setPinned] = useState(false);
  const tipId = useId();
  const ref = useRef<HTMLButtonElement>(null);

  function place(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const half = 144;
    const x = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
    setBox({ x, y: rect.top });
  }

  useEffect(() => {
    if (!pinned) return;
    function close(event: Event) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event.type === "pointerdown" && ref.current?.contains(event.target as Node)) return;
      setPinned(false);
      setBox(null);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", close);
    };
  }, [pinned]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-expanded={pinned}
        aria-describedby={box ? tipId : undefined}
        className={`group/hint inline-flex w-fit max-w-full cursor-pointer items-start justify-center gap-1 border-0 bg-transparent p-0 break-words whitespace-normal ${className}`}
        onMouseEnter={(event) => {
          place(event.currentTarget);
        }}
        onMouseLeave={() => {
          if (!pinned) setBox(null);
        }}
        onFocus={(event) => {
          place(event.currentTarget);
        }}
        onBlur={() => {
          if (!pinned) setBox(null);
        }}
        onClick={(event) => {
          const next = !pinned;
          setPinned(next);
          if (next) place(event.currentTarget);
          else setBox(null);
        }}
      >
        <span>{label}</span>
        <CircleHelp aria-hidden className="mt-[0.15em] size-3.5 shrink-0 opacity-70 group-hover/hint:opacity-100" />
        <span className="sr-only">. Ver explicación</span>
      </button>
      {box
        ? createPortal(
            <span
              id={tipId}
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
          <p className="text-xs font-semibold text-[#5c6b78]">{folder}</p>
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
      <p className="text-xs font-semibold text-[#465ab4]">Te toca firmar</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#1c2740]">
        <FileTextIcon size={16} className="shrink-0 text-[#465ab4]" aria-hidden />
        <span className="min-w-0 truncate">{fileName}</span>
      </p>
      <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{body}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

type DocBadge = "NDA" | "LOI" | "Contrato" | "Compartido" | "Chat" | "Sin acceso";

const badgeTone: Record<DocBadge, string> = {
  NDA: "bg-[#e8f6ee] text-[#17663a]",
  LOI: "bg-[#eef1ff] text-[#465ab4]",
  Contrato: "bg-[#fff4e0] text-[#8a5300]",
  Compartido: "bg-[#e8f4fb] text-[#1f6f9f]",
  Chat: "bg-[#f2f4f7] text-[#475467]",
  "Sin acceso": "bg-[#fdecec] text-[#a33a2f]",
};

export function ProcessRoom({
  files,
  bodies,
  nda,
  ndaHref = null,
  loiHref = null,
  contractHref = null,
  contractSigned = true,
  empty,
  prompt = null,
}: {
  files: ProcessFile[];
  bodies: readonly string[];
  nda: boolean;
  ndaHref?: string | null;
  loiHref?: string | null;
  contractHref?: string | null;
  contractSigned?: boolean;
  empty: string;
  prompt?: ReactNode;
}) {
  const held = files.filter((file) => file.stored === true);
  const shared = held.filter((file) => file.visible !== false);
  const hidden = held.filter((file) => file.visible === false);
  const sent = attachmentNames(bodies);
  const bare = shared.length === 0 && hidden.length === 0 && sent.length === 0 && !nda && !contractHref;
  const [openFile, setOpenFile] = useState<ProcessFile | null>(null);
  const [openSigned, setOpenSigned] = useState<{ fileName: string; href: string } | null>(null);
  const rows: { key: string; label: string; badge: DocBadge; signed?: boolean; title?: string; onOpen?: () => void }[] = [
    ...(nda
      ? [
          {
            key: "nda",
            label: sellerCopy.ndaAcceptedRow,
            badge: "NDA" as const,
            signed: true,
            onOpen: ndaHref ? () => setOpenSigned({ fileName: "Acuerdo-de-confidencialidad.pdf", href: ndaHref }) : undefined,
          },
        ]
      : []),
    ...(loiHref
      ? [{ key: "loi", label: "Carta de intenciones firmada", badge: "LOI" as const, signed: true, onOpen: () => setOpenSigned({ fileName: "Carta-de-intenciones.pdf", href: loiHref }) }]
      : []),
    ...(contractHref
      ? [
          {
            key: "contract",
            label: contractSigned ? "Contrato de compraventa firmado" : "Contrato de compraventa (borrador actual)",
            badge: "Contrato" as const,
            signed: contractSigned,
            onOpen: () => setOpenSigned({ fileName: "Contrato-de-compraventa.pdf", href: contractHref }),
          },
        ]
      : []),
    ...shared.map((file) => ({ key: `s-${file.folder}-${file.fileName}`, label: file.fileName, title: file.folder, badge: "Compartido" as const, onOpen: () => setOpenFile(file) })),
    ...sent.map((name) => ({ key: `c-${name}`, label: name, title: sellerCopy.documentsSent, badge: "Chat" as const, onOpen: () => setOpenFile({ folder: sellerCopy.documentsSent, fileName: name }) })),
    ...hidden.map((file) => ({ key: `h-${file.folder}-${file.fileName}`, label: file.fileName, title: sellerCopy.documentsPrivate, badge: "Sin acceso" as const, onOpen: () => setOpenFile(file) })),
  ];

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">
      <h3 className="text-sm font-semibold text-[#1c2740]">{sellerCopy.processDocumentsTitle}</h3>
      {prompt ? <div className="mt-4">{prompt}</div> : null}
      {bare && !prompt ? <p className="mt-3 text-sm leading-6 text-[#667085]">{empty}</p> : null}
      {bare ? null : (
        <div className="-mx-2 mt-3 flex-1">
          {rows.length === 0 ? (
            <p className="px-2 py-1.5 text-sm leading-6 text-[#667085]">{sellerCopy.documentsEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {rows.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={row.onOpen}
                    disabled={row.onOpen === undefined}
                    title={row.title}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm text-[#1c2740] enabled:hover:bg-[#f4f6fa] disabled:cursor-default"
                  >
                    {row.signed ? (
                      <ShieldCheck className="size-4 shrink-0 text-[#17663a]" aria-hidden />
                    ) : (
                      <FileTextIcon size={16} className="shrink-0 text-[#465ab4]" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{row.label}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${badgeTone[row.badge]}`}>{row.badge}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
      <FilePreviewDialog
        file={openSigned ? { fileName: openSigned.fileName, folder: "Firmado en Relify", href: openSigned.href } : null}
        onClose={() => {
          setOpenSigned(null);
        }}
      />
    </section>
  );
}
