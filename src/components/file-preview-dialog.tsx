"use client";

import { PdfPages } from "@/components/pdf-pages";

import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { FileTextIcon } from "@/components/ui/file-text";
import { sellerCopy } from "@/lib/seller-copy";

/** Centred document modal: a card over the page, never a full-screen takeover. */
export const documentDeskClass =
  "fixed top-1/2 left-1/2 z-50 m-0 hidden h-[min(88dvh,60rem)] max-h-none w-[min(60rem,calc(100vw-1.5rem))] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[#e6e9f0] bg-[#f4f5f8] p-0 text-[#1c2740] shadow-[0_32px_80px_-24px_rgba(28,39,64,0.45)] open:flex backdrop:bg-[#1c2740]/45 backdrop:backdrop-blur-[2px]";

export const documentDeskHeaderClass = "flex shrink-0 items-center justify-between gap-3 border-b border-[#e6e9f0] bg-white px-4 py-3 sm:px-5";

/** Same file as an attachment download: our PDF routes honour ?download=1. */
export function downloadHref(href: string): string {
  return href.startsWith("/acuerdos/") || href.startsWith("/cuenta/acuerdo") ? `${href}${href.includes("?") ? "&" : "?"}download=1` : href;
}

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

      if (target instanceof Element && (target.closest("dialog") || target.closest("[data-bottom-sheet]"))) {
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

  if (!file) {
    return null;
  }

  return (
    <dialog ref={dialogRef} className={documentDeskClass} onClose={onClose}>
      <div className={documentDeskHeaderClass}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef0fb] text-[#465ab4]">
            <FileTextIcon size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{file.fileName}</p>
            <p className="truncate text-xs text-[#667085]">{file.folder}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {file.href ? (
            <a
              href={downloadHref(file.href)}
              download={file.fileName}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#465ab4] px-3 text-sm font-medium text-white hover:bg-[#3b4da0] focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 focus-visible:outline-none"
            >
              <Download className="size-4" aria-hidden />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
            }}
            className="inline-flex size-9 items-center justify-center rounded-lg text-[#5c6b78] hover:bg-[#f2f4f7] hover:text-[#1c2740] focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 focus-visible:outline-none"
            aria-label={sellerCopy.closeDocument}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        {file.href && kind === "pdf" ? (
          <PdfPages title={file.fileName} src={file.href} />
        ) : file.href && kind === "image" ? (
          <div className="flex h-full items-center justify-center">
            {/* Seller uploads are private bytes, not a remote image the optimizer can fetch. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.href} alt="" className="max-h-full max-w-full rounded-lg bg-white object-contain" />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-[#e6e9f0] bg-white px-8 text-center text-[#1c2740]">
            <FileTextIcon size={64} className="text-[#465ab4]" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">{file.fileName}</h2>
            <p className="mt-1 text-sm text-[#667085]">{file.folder}</p>
            {file.href && kind === null ? (
              <a
                href={file.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#465ab4] px-4 text-base font-medium text-white"
              >
                {sellerCopy.documentOpenFile}
              </a>
            ) : null}
            {!file.href ? <p className="mt-4 text-sm leading-6 text-[#667085]">{sellerCopy.documentViewerBody}</p> : null}
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
