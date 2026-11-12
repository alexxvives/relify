"use client";

import { useState, useTransition } from "react";
import { PdfThumb } from "@/components/pdf-pages";
import { companyPdfCopy, type SellerTeaserDesk } from "@/lib/company-pdf-copy";

export function SellerPdfCard({
  desk,
  previewHref,
  downloadHref,
  onRegenerate,
}: {
  desk: SellerTeaserDesk;
  previewHref: string;
  downloadHref: string;
  onRegenerate: () => Promise<{ ok: true; shareUrl: string } | { ok: false; message: string }>;
}) {
  const [shareUrl, setShareUrl] = useState(desk.shareUrl);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

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

  function regenerate(): void {
    start(async () => {
      const result = await onRegenerate();
      if (result.ok) {
        setShareUrl(result.shareUrl);
        setCopied(false);
        setNote(companyPdfCopy.regeneratedShare);
        return;
      }
      setNote(result.message);
    });
  }

  const actions = (
    <div className="flex flex-wrap gap-2" data-teaser-actions>
      <a
        href={downloadHref}
        className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c2740] px-4 text-sm font-medium text-white"
      >
        {companyPdfCopy.teaserDownload}
      </a>
      <button
        type="button"
        onClick={() => {
          void copyLink();
        }}
        disabled={!shareUrl}
        className="inline-flex h-11 items-center justify-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium text-[#1c2740] disabled:opacity-50"
      >
        {copied ? companyPdfCopy.copiedShare : companyPdfCopy.copyShare}
      </button>
      <button
        type="button"
        onClick={regenerate}
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium text-[#1c2740] disabled:opacity-60"
      >
        {pending ? companyPdfCopy.regeneratingShare : companyPdfCopy.regenerateShare}
      </button>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#eef0f3] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[#1c2740]">{companyPdfCopy.sellerTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{companyPdfCopy.sellerBody}</p>
        </div>
        <div className="lg:hidden">{actions}</div>
      </div>
      <div className="hidden gap-5 p-5 lg:grid lg:grid-cols-[7.5rem_minmax(0,1fr)] lg:items-start">
        <div className="w-[7.5rem]">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#667085] uppercase">
            {companyPdfCopy.previewLabel}
          </p>
          <div className="aspect-[210/297] overflow-hidden rounded-xl border border-[#e7eaee] bg-white shadow-sm">
            <PdfThumb
              src={previewHref}
              title={companyPdfCopy.teaserTitle}
              fallback={<span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-[#667085]">PDF</span>}
            />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[#3d4a63]">
            {desk.published ? companyPdfCopy.shareHint : companyPdfCopy.shareHintUnpublished}
          </p>
          <p className="mt-3 text-sm text-[#5c6b78]">
            {companyPdfCopy.downloadsLabel}:{" "}
            <span className="font-semibold text-[#1c2740]">{desk.downloads}</span>
          </p>
          <div className="mt-4">{actions}</div>
          {note ? (
            <p className="mt-3 text-sm text-[#3d4a63]" role="status">
              {note}
            </p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-[#eef0f3] bg-[#f7f8fb] px-5 py-4 lg:hidden">
        <p className="text-sm text-[#3d4a63]">
          {desk.published ? companyPdfCopy.shareHint : companyPdfCopy.shareHintUnpublished}
        </p>
        <p className="mt-2 text-sm text-[#5c6b78]">
          {companyPdfCopy.downloadsLabel}:{" "}
          <span className="font-semibold text-[#1c2740]">{desk.downloads}</span>
        </p>
        {note ? (
          <p className="mt-2 text-sm text-[#3d4a63]" role="status">
            {note}
          </p>
        ) : null}
      </div>
      <div className="border-t border-[#eef0f3] bg-[#f7f8fb] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#1c2740]">{companyPdfCopy.dossierInfoTitle}</h3>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{companyPdfCopy.dossierInfoBody}</p>
      </div>
    </section>
  );
}
