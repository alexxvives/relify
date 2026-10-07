"use client";

import { useEffect, useRef } from "react";
import { FileTextIcon } from "@/components/ui/file-text";
import { sellerCopy } from "@/lib/seller-copy";

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 m-0 max-h-[85vh] w-[min(52rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/40";

function previewKind(fileName: string): "image" | "pdf" | null {
  if (/\.(png|jpe?g|gif|webp)$/i.test(fileName)) {
    return "image";
  }

  if (/\.pdf$/i.test(fileName)) {
    return "pdf";
  }

  return null;
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

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!file || !dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, [file]);

  return (
    <dialog
      ref={dialogRef}
      className={dialogClass}
      onClose={onClose}
    >
      <div className="flex flex-col items-center text-center">
        {file?.href && kind === "image" ? (
          // Seller uploads are private bytes, not a remote image the optimizer can fetch.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.href} alt="" className="max-h-[60vh] w-full rounded-xl object-contain" />
        ) : file?.href && kind === "pdf" ? (
          <iframe title={file.fileName} src={file.href} className="h-[60vh] w-full rounded-xl border border-[#e7eaee]" />
        ) : (
          <FileTextIcon size={64} className="text-[#465ab4]" aria-hidden />
        )}
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
        <button
          type="button"
          onClick={() => {
            dialogRef.current?.close();
          }}
          className="mt-5 inline-flex h-11 items-center rounded-[14px] border border-[#e7eaee] px-4 text-base font-medium"
        >
          {sellerCopy.closeDocument}
        </button>
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
