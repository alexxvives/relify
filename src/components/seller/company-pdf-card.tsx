"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FileText, MoreHorizontal } from "lucide-react";
import { PdfThumb } from "@/components/seller/pdf-pages";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pending, start] = useTransition();
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (menu.current && event.target instanceof Node && !menu.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
    setMenuOpen(false);
  }

  function regenerate(): void {
    start(async () => {
      const result = await onRegenerate();
      if (result.ok) {
        setShareUrl(result.shareUrl);
        setCopied(false);
        setNote(companyPdfCopy.regeneratedShare);
        setMenuOpen(false);
        return;
      }
      setNote(result.message);
      setMenuOpen(false);
    });
  }

  return (
    <section data-teaser-card className="rounded-xl border border-[#e7eaee] bg-white px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2" data-teaser-actions>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eef2ff] text-[#465ab4]">
          <FileText className="size-4" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#1c2740]">{companyPdfCopy.sellerTitle}</p>
        <a
          href={downloadHref}
          aria-label={companyPdfCopy.teaserDownload}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-semibold text-[#465ab4] hover:bg-[#eef2ff] focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 focus-visible:outline-none"
        >
          {companyPdfCopy.teaserDownloadShort}
        </a>
        <div ref={menu} className="relative shrink-0">
          <button
            type="button"
            aria-label={companyPdfCopy.moreActions}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-8 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-[#e7eaee] bg-white py-1 shadow-[0_12px_32px_-16px_rgba(28,39,64,0.35)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void copyLink();
                }}
                disabled={!shareUrl}
                className="flex h-10 w-full items-center px-3 text-left text-sm text-[#1c2740] hover:bg-[#f8f9fb] disabled:opacity-50"
              >
                {copied ? companyPdfCopy.copiedShare : companyPdfCopy.copyShare}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={regenerate}
                disabled={pending}
                className="flex h-10 w-full items-center px-3 text-left text-sm text-[#1c2740] hover:bg-[#f8f9fb] disabled:opacity-60"
              >
                {pending ? companyPdfCopy.regeneratingShare : companyPdfCopy.regenerateShare}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {note ? (
        <p className="mt-1.5 text-xs text-[#3d4a63]" role="status">
          {note}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setPreviewOpen((open) => !open)}
        className="mt-2 hidden h-8 items-center rounded-full px-2 text-xs font-medium text-[#667085] hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none lg:inline-flex"
      >
        {previewOpen ? companyPdfCopy.hidePreview : companyPdfCopy.previewOnDemand}
      </button>
      {previewOpen ? (
        <div className="mt-3 hidden w-[7.5rem] lg:block">
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
      ) : null}
    </section>
  );
}
