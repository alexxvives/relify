"use client";

import { useEffect, useRef, useState } from "react";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { PlatformTermsForm } from "@/components/platform-terms-form";
import { platformTermsCopy } from "@/lib/platform-terms";

export function PlatformTermsDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white p-6 text-[#1c2740] open:block backdrop:bg-[#1c2740]/40"
      onCancel={(event) => {
        event.preventDefault();
      }}
    >
      <h2 className="text-2xl font-semibold tracking-tight">{platformTermsCopy.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{platformTermsCopy.intro}</p>
      <div className="mt-4 flex max-h-[50vh] flex-col gap-3 overflow-y-auto text-sm leading-6">
        {platformTermsCopy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <PlatformTermsForm />
    </dialog>
  );
}

export function SignatureDocument({ when, signature }: { when: string; signature: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#d5dbe3] bg-[#e7eaee] p-3 text-left shadow-[0_12px_30px_-24px_rgba(28,39,64,0.45)]"
      >
        <span className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white px-3 py-3 shadow-[0_10px_24px_-18px_rgba(28,39,64,0.7)]">
          <span className="releva-word text-sm leading-none text-[#1c2740]">Releva</span>
          <span className="mt-2 text-[11px] font-semibold leading-4 text-[#1c2740]">{platformTermsCopy.signedTitle}</span>
          <span className="mt-2 line-clamp-4 text-[9px] leading-[1.35] text-[#5c6b78]">{platformTermsCopy.body.join(" ")}</span>
          <span className="mt-auto flex items-end justify-between gap-2 border-t border-[#eef0f3] pt-2">
            <span className="text-[9px] leading-3 text-[#8b95a7]">
              {platformTermsCopy.signedOn} {when}
            </span>
            {signature ? (
              // The signature is a drawing stored for this account, not a remote image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signature} alt="" className="h-8 max-w-28 object-contain object-right" />
            ) : (
              <span className="text-[9px] leading-3 text-[#8b95a7]">{platformTermsCopy.signedMissing}</span>
            )}
          </span>
        </span>
      </button>
      <FilePreviewDialog
        file={
          open
            ? {
                fileName: "Acuerdo-con-Releva.pdf",
                folder: platformTermsCopy.signedTitle,
                href: "/cuenta/acuerdo",
              }
            : null
        }
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
