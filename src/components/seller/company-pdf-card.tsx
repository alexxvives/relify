"use client";

import { useState } from "react";
import { Download, Link2 } from "lucide-react";
import { FilePreviewDialog } from "@/components/investor/file-preview-dialog";
import { PdfThumb } from "@/components/seller/pdf-pages";
import { companyPdfCopy, type SellerTeaserDesk } from "@/lib/company-pdf-copy";

export function SellerPdfCard({
  desk,
  previewHref,
  downloadHref,
}: {
  desk: SellerTeaserDesk;
  previewHref: string;
  downloadHref: string;
}) {
  const [shareUrl] = useState(desk.shareUrl);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function copyLink(): Promise<void> {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setNote(companyPdfCopy.copiedShare);
    } catch {
      setNote(companyPdfCopy.copyFailed);
    }
  }

  return (
    <section data-teaser-card className="mx-auto w-full max-w-lg rounded-2xl border border-[#e7eaee] bg-white p-3 pb-4 sm:p-4">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-[#1c2740]">{companyPdfCopy.sellerTitle}</p>
        <p className="mt-1 hidden text-sm leading-5 text-[#5c6b78] sm:block">{companyPdfCopy.sellerBody}</p>
        <button
          type="button"
          data-teaser-preview
          onClick={() => {
            setPreviewOpen(true);
          }}
          className="mt-3 w-[7.5rem] overflow-hidden rounded-lg border border-[#e7eaee] bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none sm:w-[9.5rem]"
          aria-label={`${companyPdfCopy.previewLabel}. Abrir vista grande.`}
        >
          <div className="aspect-[210/297]">
            <PdfThumb
              src={previewHref}
              title={companyPdfCopy.teaserTitle}
              fallback={<span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-[#667085]">PDF</span>}
            />
          </div>
        </button>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2" data-teaser-actions>
          <a
            href={downloadHref}
            aria-label={companyPdfCopy.teaserDownload}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#465ab4] px-3 text-xs font-semibold text-white hover:bg-[#3a4c9c] focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 focus-visible:outline-none"
          >
            <Download className="size-3.5" aria-hidden />
            {companyPdfCopy.teaserDownloadShort}
          </a>
          <button
            type="button"
            aria-label={copied ? companyPdfCopy.copiedShare : companyPdfCopy.copyShare}
            disabled={!shareUrl}
            onClick={() => {
              void copyLink();
            }}
            className="inline-flex size-9 items-center justify-center rounded-full border border-[#e7eaee] text-[#465ab4] hover:bg-[#eef1fb] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:opacity-50"
          >
            <Link2 className="size-4" aria-hidden />
          </button>
        </div>
        {note ? (
          <p className="mt-2 text-xs text-[#3d4a63]" role="status">
            {note}
          </p>
        ) : null}
      </div>
      <FilePreviewDialog
        file={previewOpen ? { fileName: `${companyPdfCopy.teaserFile}.pdf`, folder: "", href: previewHref } : null}
        onClose={() => {
          setPreviewOpen(false);
        }}
      />
    </section>
  );
}
