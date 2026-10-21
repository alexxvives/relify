"use client";

import { useEffect, useRef } from "react";
import { FileTextIcon } from "@/components/ui/file-text";
import { sellerCopy } from "@/lib/seller-copy";

export const documentDeskClass =
  "fixed inset-0 z-50 m-0 flex h-dvh max-h-none w-dvw max-w-none translate-none flex-col overflow-hidden border-0 bg-[#3c4148] p-0 text-white shadow-none backdrop:bg-[#1c2740]/50";

function previewKind(fileName: string): "image" | "pdf" | null {
  if (/\.(png|jpe?g|gif|webp)$/i.test(fileName)) {
    return "image";
  }

  if (/\.pdf$/i.test(fileName)) {
    return "pdf";
  }

  return null;
}

export function useModalScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    function block(event: Event) {
      const target = event.target;

      if (target instanceof Element && target.closest("dialog")) {
        return;
      }

      event.preventDefault();
    }

    document.addEventListener("wheel", block, { passive: false });
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
      document.removeEventListener("wheel", block);
      document.removeEventListener("touchmove", block);
    };
  }, [open]);
}

export function FilePreviewDialog({
  file,
  onClose,
}: {
  file: { fileName: string; folder: string; href: string | null } | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const kind = file ? previewKind(file.fileName) : null;
  useModalScrollLock(file !== null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!file || !dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, [file]);

  return (
    <dialog ref={dialogRef} className={documentDeskClass} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 truncate text-sm font-medium">{file?.fileName}</p>
        <button
          type="button"
          onClick={() => {
            dialogRef.current?.close();
          }}
          className="shrink-0 text-sm font-medium text-white/80"
        >
          {sellerCopy.closeDocument}
        </button>
      </div>
      <div className="min-h-0 flex-1 px-4 pb-6">
        {file?.href && kind === "pdf" ? (
          <iframe title={file.fileName} src={file.href} className="h-full w-full bg-white shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]" />
        ) : file?.href && kind === "image" ? (
          <div className="flex h-full items-center justify-center">
            {/* Seller uploads are private bytes, not a remote image the optimizer can fetch. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.href} alt="" className="max-h-full max-w-3xl bg-white object-contain shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]" />
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center bg-white px-8 text-center text-[#1c2740] shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]">
            <FileTextIcon size={64} className="text-[#465ab4]" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">{file?.fileName}</h2>
            <p className="mt-1 text-sm text-[#667085]">{file?.folder}</p>
            {file?.href && kind === null ? (
              <a
                href={file.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 items-center rounded-[14px] bg-[#465ab4] px-4 text-base font-medium text-white"
              >
                {sellerCopy.documentOpenFile}
              </a>
            ) : null}
            {file && !file.href ? <p className="mt-4 text-sm leading-6 text-[#667085]">{sellerCopy.documentViewerBody}</p> : null}
          </div>
        )}
      </div>
    </dialog>
  );
}

export function fileHref(file: { id?: string; stored?: boolean; platform?: boolean } | null): string | null {
  if (!file?.id || (!file.stored && !file.platform)) {
    return null;
  }

  return `/mi-empresa/documentos/archivo/${file.id}`;
}
