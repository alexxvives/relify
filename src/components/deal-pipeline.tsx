"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { FilePreviewDialog, fileHref } from "@/components/file-preview-dialog";
import { FileTextIcon } from "@/components/ui/file-text";
import { FolderOpenIcon } from "@/components/ui/folder-open";
import { attachmentNames } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import { stepCue, type DealStep, type ProcessFile } from "@/lib/deal-pipeline";

export function DealPipeline({
  steps,
  role,
  onDark = false,
  signTo,
}: {
  steps: DealStep[];
  role: "investor" | "seller";
  onDark?: boolean;
  signTo?: string;
}) {
  const current = steps.find((step) => step.state === "current");
  const cue = current ? stepCue(current.id, role) : { yours: false, action: "La compraventa está hecha." };
  const signHref = cue.yours && (current?.id === "nda" || current?.id === "loi") ? (signTo ?? "#firmar") : null;
  const currentIndex = steps.findIndex((step) => step.state === "current");
  const span = Math.max(steps.length - 1, 1);
  const fill = currentIndex < 0 ? 1 : currentIndex / span;

  return (
    <div>
      <div className="overflow-x-auto py-2">
        <ol className="relative mx-auto flex min-w-[40rem] items-start" aria-label="Recorrido del proceso">
          <span className={onDark ? "absolute top-3 right-4 left-4 h-1 rounded-full bg-white/20" : "absolute top-3 right-4 left-4 h-1 rounded-full bg-[#e6eaf2]"} aria-hidden />
          <span
            className={onDark ? "absolute top-3 left-4 h-1 rounded-full bg-[#8dffc4]" : "absolute top-3 left-4 h-1 rounded-full bg-[#465ab4]"}
            style={{ width: `calc((100% - 2rem) * ${fill})` }}
            aria-hidden
          />
          {steps.map((step) => {
            const labelClass =
              step.state === "current"
                ? onDark
                  ? "rounded-full bg-white/15 px-2 py-0.5 text-center text-[11px] font-semibold text-white"
                  : "rounded-full bg-[#eef1ff] px-2 py-0.5 text-center text-[11px] font-semibold text-[#465ab4]"
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
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
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
      <TurnCue cue={cue} onDark={onDark} signHref={signHref} />
    </div>
  );
}

function TurnCue({
  cue,
  onDark,
  signHref,
}: {
  cue: { yours: boolean; action: string };
  onDark: boolean;
  signHref: string | null;
}) {
  const router = useRouter();

  function openSign(href: string) {
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    router.push(href);
  }

  if (cue.yours) {
    return (
      <div
        className={
          onDark
            ? "mx-auto mt-4 flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-lg"
            : "mx-auto mt-4 flex max-w-xl items-center gap-3 rounded-2xl border border-[#c9d2f5] bg-[#eef1ff] px-4 py-3 text-left"
        }
      >
        <span className="relative flex size-3 shrink-0" aria-hidden>
          <span className="deal-pulse absolute inset-0 rounded-full bg-[#465ab4]" />
          <span className="relative size-3 rounded-full bg-[#465ab4]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-[0.14em] text-[#465ab4] uppercase">Tu turno</span>
          <span className="mt-0.5 block text-sm font-semibold text-[#1c2740]">{cue.action}</span>
        </span>
        {signHref ? (
          <button
            type="button"
            onClick={() => {
              openSign(signHref);
            }}
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#465ab4] px-3 text-sm font-semibold text-white"
          >
            Firmar ahora
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <p className={onDark ? "mt-3 text-center text-sm text-white/80" : "mt-3 text-center text-sm text-[#5c6b78]"}>{cue.action}</p>
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
        className={`cursor-help border-0 bg-transparent p-0 ${className}`}
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
              className="pointer-events-none fixed z-[80] w-64 -translate-x-1/2 -translate-y-full rounded-xl bg-[#1c2740] px-3 py-2 text-left text-xs leading-5 font-normal text-white shadow-lg"
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
        <span className="deal-pulse absolute -inset-1.5 rounded-full bg-[#465ab4]" />
        <span className="relative block size-6 rounded-full border-2 border-white bg-[#465ab4] shadow-[0_0_0_4px_rgba(70,90,180,0.18)]" />
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
  const shared = files.filter((file) => file.visible !== false);
  const hidden = files.filter((file) => file.visible === false);
  const sent = attachmentNames(bodies);
  const bare = shared.length === 0 && hidden.length === 0 && sent.length === 0 && !nda;
  const [openFile, setOpenFile] = useState<ProcessFile | null>(null);
  const other = nda || hidden.length > 0 || sent.length > 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">
      <h3 className="text-sm font-semibold text-[#1c2740]">{sellerCopy.processDocumentsTitle}</h3>
      {prompt ? <div className="mt-4">{prompt}</div> : null}
      {bare && !prompt ? <p className="mt-3 text-sm leading-6 text-[#667085]">{empty}</p> : null}
      <div className="mt-4 flex-1 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] p-4">
        <p className="text-xs font-semibold tracking-wide text-[#1c2740] uppercase">{sellerCopy.documentsShared}</p>
        <div className="mt-2">
          <ProcessDocuments files={shared} empty={sellerCopy.documentsEmpty} onOpen={setOpenFile} />
        </div>
      </div>
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
