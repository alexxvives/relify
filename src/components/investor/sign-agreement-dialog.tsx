"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { AgreementDocument } from "@/components/investor/agreement-document";
import { useModalScrollLock } from "@/components/investor/file-preview-dialog";
import { SignaturePad } from "@/components/investor/signature-pad";
import { Button } from "@/components/ui/form";
import { platformTermsCopy } from "@/lib/platform-terms";

/**
 * One signing popup for every agreement (buyer NDA/LOI, advisor NDA): title, intro, the document in a framed
 * scroll box, the signature pad and one submit button. Callers own the server action and the hidden fields.
 */
export function SignAgreementDialog({
  title,
  intro,
  agreement,
  action,
  pending,
  done,
  collectIdentity,
  submitLabel,
  hidden,
  error,
  onClose,
}: {
  title: string;
  intro: string;
  agreement: string;
  action: (formData: FormData) => void;
  pending: boolean;
  /** True once the action succeeded: the dialog closes itself. */
  done: boolean;
  collectIdentity: boolean;
  submitLabel: string;
  hidden: ReactNode;
  error: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalScrollLock(true);
  const [signature, setSignature] = useState("");
  const [needsSignature, setNeedsSignature] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, []);

  useEffect(() => {
    if (done) {
      dialogRef.current?.close();
    }
  }, [done]);

  return (
    <dialog
      ref={dialogRef}
      data-sign-agreement-dialog
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(48rem,calc(100%-2rem))] w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 text-left text-[#1c2740] open:flex backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-3 px-6 pt-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{intro}</p>
        </div>
        <form method="dialog">
          <button
            type="submit"
            aria-label="Cerrar"
            className="inline-flex size-9 items-center justify-center rounded-lg text-[#5c6b78] hover:bg-[#f2f4f7] hover:text-[#1c2740]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </form>
      </div>
      <form
        action={action}
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          if (signature.length === 0) {
            event.preventDefault();
            setNeedsSignature(false);
            window.requestAnimationFrame(() => {
              setNeedsSignature(true);
            });
          }
        }}
      >
        <div className="mx-6 mt-5 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#e7eaee] bg-[#fafbfc] px-5 py-5">
          <AgreementDocument text={agreement} />
        </div>
        <div className="shrink-0 px-6 pt-4 pb-1">
          <input type="hidden" name="signature" value={signature} />
          <SignaturePad
            invalid={needsSignature}
            collectIdentity={collectIdentity}
            onChange={(value) => {
              setSignature(value);
              if (value.length > 0) {
                setNeedsSignature(false);
              }
            }}
          />
          {needsSignature ? (
            <p role="alert" className="mt-2 text-sm text-[#c0362c]">
              {platformTermsCopy.signRequired}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pt-3 pb-6">
          {hidden}
          <Button type="submit" disabled={pending} className="h-10 rounded-full text-sm font-semibold">
            {pending ? "Firmando…" : submitLabel}
          </Button>
        </div>
        {error}
      </form>
    </dialog>
  );
}
