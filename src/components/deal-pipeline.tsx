"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { FilePreviewDialog, fileHref } from "@/components/file-preview-dialog";
import { FileTextIcon } from "@/components/ui/file-text";
import { FolderOpenIcon } from "@/components/ui/folder-open";
import { attachmentNames } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import type { DealStep, ProcessFile } from "@/lib/deal-pipeline";

export function DealPipeline({
  steps,
  compact = false,
  onDark = false,
}: {
  steps: DealStep[];
  compact?: boolean;
  onDark?: boolean;
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <ol className={compact ? "flex min-w-[32rem] items-start py-1" : "flex min-w-[44rem] items-start py-3"} aria-label="Recorrido del proceso">
          {steps.map((step, index) => {
            const previous = steps[index - 1];
            const doneLine = onDark ? "bg-[#8dffc4]" : "bg-[#17663a]";
            const lineIn = index === 0 ? "bg-transparent" : previous?.state === "done" ? doneLine : onDark ? "bg-white/25" : "bg-[#e1e6ee]";
            const lineOut =
              index === steps.length - 1 ? "bg-transparent" : step.state === "done" ? doneLine : onDark ? "bg-white/25" : "bg-[#e1e6ee]";
            const labelClass =
              step.state === "current"
                ? onDark
                  ? "text-center text-xs font-semibold text-white"
                  : "text-center text-xs font-semibold text-[#465ab4]"
                : step.id === "close"
                  ? onDark
                    ? "text-center text-xs font-semibold text-white"
                    : "text-center text-xs font-semibold text-[#1c2740]"
                  : step.state === "done"
                    ? onDark
                      ? "text-center text-xs font-medium text-[#b8ffd8]"
                      : "text-center text-xs font-medium text-[#17663a]"
                    : onDark
                      ? "text-center text-xs text-white/55"
                      : "text-center text-xs text-[#8b95a7]";

            return (
              <li
                key={step.id}
                aria-current={step.state === "current" ? "step" : undefined}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="flex w-full items-center">
                  <span className={`h-0.5 flex-1 ${lineIn}`} />
                  <StepDot state={step.state} onDark={onDark} />
                  <span className={`h-0.5 flex-1 ${lineOut}`} />
                </span>
                <span className={labelClass}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StepDot({ state, onDark = false }: { state: DealStep["state"]; onDark?: boolean }) {
  if (state === "current") {
    return (
      <span className="relative size-3.5 shrink-0">
        <span className="deal-pulse absolute inset-0 rounded-full bg-[#465ab4]" />
        <span className="relative block size-3.5 rounded-full border-2 border-white bg-[#465ab4] shadow-[0_0_0_4px_rgba(70,90,180,0.16)]" />
      </span>
    );
  }

  if (state === "done") {
    return <span className={onDark ? "size-3.5 shrink-0 rounded-full bg-[#8dffc4]" : "size-3.5 shrink-0 rounded-full bg-[#17663a]"} />;
  }

  return (
    <span className={onDark ? "size-3.5 shrink-0 rounded-full border-2 border-white/40 bg-transparent" : "size-3.5 shrink-0 rounded-full border-2 border-[#d5dbe3] bg-white"} />
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

export function ProcessRoom({
  files,
  bodies,
  nda,
  empty,
}: {
  files: ProcessFile[];
  bodies: readonly string[];
  nda: boolean;
  empty: string;
}) {
  const shared = files.filter((file) => file.visible !== false);
  const hidden = files.filter((file) => file.visible === false);
  const sent = attachmentNames(bodies);
  const bare = shared.length === 0 && hidden.length === 0 && sent.length === 0 && !nda;
  const [openFile, setOpenFile] = useState<ProcessFile | null>(null);
  const other = nda || hidden.length > 0 || sent.length > 0;

  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
      <h3 className="text-sm font-semibold text-[#1c2740]">{sellerCopy.processDocumentsTitle}</h3>
      {bare ? <p className="mt-3 text-sm leading-6 text-[#667085]">{empty}</p> : null}
      <div className="mt-4 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] p-4">
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
