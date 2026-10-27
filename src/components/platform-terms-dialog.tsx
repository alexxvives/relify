"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, LogOut } from "lucide-react";
import { signOutAction } from "@/app/cuenta/actions";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { PdfThumb } from "@/components/pdf-pages";
import { PlatformTermsForm } from "@/components/platform-terms-form";
import { PlatformTermsText } from "@/components/platform-terms-text";
import { authCopy } from "@/lib/auth-copy";
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
      <div className="mt-5 max-h-[50vh] overflow-y-auto rounded-xl border border-[#e7eaee] bg-[#fafbfc] px-5 py-5">
        <PlatformTermsText />
      </div>
      <PlatformTermsForm />
      {/* The modal covers the whole shell, so it carries its own way out. */}
      <form action={signOutAction} className="mt-4 flex justify-end border-t border-[#eef0f3] pt-4">
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d5dbe3] bg-white px-4 text-sm font-medium text-[#1c2740] hover:bg-[#f5f6f8]"
        >
          <LogOut className="size-4" aria-hidden />
          {authCopy.signOut}
        </button>
      </form>
    </dialog>
  );
}

export function SignatureDocument({ when }: { when: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        aria-label={`${platformTermsCopy.signedTitle} · ${platformTermsCopy.signedOn} ${when} · abrir`}
        title={`${platformTermsCopy.signedOn} ${when}`}
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#d5dbe3] bg-white text-left shadow-[0_12px_30px_-24px_rgba(28,39,64,0.45)] transition hover:border-[#465ab4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4]"
      >
        <span className="relative block min-h-56 flex-1 overflow-hidden bg-white md:min-h-0">
          <span className="absolute inset-0 block transition group-hover:-translate-y-0.5">
            <PdfThumb
              src="/cuenta/acuerdo"
              title={platformTermsCopy.signedTitle}
              fallback={
                <span className="flex size-full flex-col bg-white p-3">
                  <span className="releva-word text-xs leading-none text-[#1c2740]">Relify</span>
                  <span className="mt-2 line-clamp-6 text-[10px] leading-[1.35] text-[#8b95a7]">{platformTermsCopy.body.join(" ")}</span>
                </span>
              }
            />
          </span>
        </span>
        <span className="flex items-center gap-1.5 border-t border-[#e7eaee] px-4 py-3 text-sm font-semibold text-[#1c2740]">
          <FileText className="size-4 shrink-0 text-[#465ab4]" aria-hidden />
          {platformTermsCopy.signedTitle}
        </span>
      </button>
      <FilePreviewDialog
        file={
          open
            ? {
                fileName: "Acuerdo-con-Relify.pdf",
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
