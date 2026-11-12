"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Download, MoreHorizontal } from "lucide-react";
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
    <section data-teaser-card className="rounded-2xl border border-[#e7eaee] bg-white p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          data-teaser-preview
          className="w-[4.75rem] shrink-0 overflow-hidden rounded-lg border border-[#e7eaee] bg-white shadow-sm sm:w-[7.5rem]"
        >
          <div className="aspect-[210/297]">
            <PdfThumb
              src={previewHref}
              title={companyPdfCopy.teaserTitle}
              fallback={<span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-[#667085]">PDF</span>}
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1c2740]">{companyPdfCopy.sellerTitle}</p>
          <p className="mt-1 hidden text-sm leading-5 text-[#5c6b78] sm:block">{companyPdfCopy.sellerBody}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2" data-teaser-actions>
            <a
              href={downloadHref}
              aria-label={companyPdfCopy.teaserDownload}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#465ab4] px-3 text-xs font-semibold text-white hover:bg-[#3a4c9c] focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 focus-visible:outline-none"
            >
              <Download className="size-3.5" aria-hidden />
              {companyPdfCopy.teaserDownloadShort}
            </a>
            <div ref={menu} className="relative shrink-0">
              <button
                type="button"
                aria-label={companyPdfCopy.moreActions}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex size-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
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
            <p className="mt-2 text-xs text-[#3d4a63]" role="status">
              {note}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
