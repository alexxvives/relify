"use client";

import { useEffect, useRef, useState } from "react";
import { PlatformTermsForm } from "@/components/platform-terms-form";
import { useModalScrollLock } from "@/components/file-preview-dialog";
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
      className="fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white p-6 text-[#1c2740] backdrop:bg-[#1c2740]/40"
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
        className="flex h-full min-h-64 w-full flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-[#fbfbfc] text-left shadow-[0_12px_30px_-24px_rgba(28,39,64,0.45)]"
      >
        <span className="border-b border-[#e7eaee] bg-white px-4 py-3">
          <span className="block text-[11px] font-medium tracking-[0.14em] text-[#8b95a7] uppercase">Documento</span>
          <span className="mt-1 block text-sm font-semibold text-[#1c2740]">{platformTermsCopy.signedTitle}</span>
          <span className="mt-1 block text-xs text-[#64748b]">
            {platformTermsCopy.signedOn} {when}
          </span>
        </span>
        <span className="flex flex-1 items-center justify-center px-4 py-5">
          {signature ? (
            // The signature is a drawing stored for this account, not a remote image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signature} alt="" className="max-h-36 w-full object-contain" />
          ) : (
            <span className="text-sm leading-6 text-[#64748b]">{platformTermsCopy.signedMissing}</span>
          )}
        </span>
      </button>
      {open ? (
        <SignedTermsDialog
          when={when}
          signature={signature}
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function SignedTermsDialog({
  when,
  signature,
  onClose,
}: {
  when: string;
  signature: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalScrollLock(true);

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
      className="fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1c2740]">{platformTermsCopy.signedTitle}</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            {platformTermsCopy.signedOn} {when}
          </p>
        </div>
        <form method="dialog">
          <button type="submit" className="text-sm font-medium text-[#5c6b78]">
            Cerrar
          </button>
        </form>
      </div>
      <div className="mt-4 flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
        {platformTermsCopy.body.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-6 text-[#3d4a63]">
            {paragraph}
          </p>
        ))}
      </div>
      {signature ? (
        // The signature is a drawing stored for this account, not a remote image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signature} alt="" className="mt-4 h-48 w-full rounded-xl border border-[#e7eaee] bg-[#fbfbfc] object-contain" />
      ) : (
        <p className="mt-4 text-sm text-[#64748b]">{platformTermsCopy.signedMissing}</p>
      )}
    </dialog>
  );
}
