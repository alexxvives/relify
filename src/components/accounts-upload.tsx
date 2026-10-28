"use client";

import { useRef, useState } from "react";
import { compactButtonClass } from "@/components/ui/compact-button";
import { readAnnualAccountsAction, type AnnualAccountsState } from "@/app/(app)/mi-empresa/accounts-actions";
import { companyCopy } from "@/lib/company-copy";

export function AccountsUpload({
  onApply,
  compact = false,
}: {
  onApply: (result: Extract<AnnualAccountsState, { ok: true }>) => void;
  compact?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function readFile(file: File) {
    setPending(true);
    setError(null);
    setMessage(null);
    const data = new FormData();
    data.set("accounts", file);
    const result = await readAnnualAccountsAction(data);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    onApply(result);
    setMessage(result.notice);
    closeDialog();
  }

  return (
    <div className={compact ? "flex items-center gap-3 pb-2" : "flex flex-col gap-2"}>
      {compact ? <p className="text-sm font-semibold text-[#2b3b4a]">{companyCopy.accountsPrompt}</p> : null}
      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
        }}
        className="inline-flex h-11 shrink-0 items-center rounded-xl bg-[#465ab4] px-4 text-base font-medium text-white"
      >
        {companyCopy.accountsOpen}
      </button>
      {message ? <p className="text-sm leading-6 text-[#3d646c]">{message}</p> : null}
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] open:block backdrop:bg-[#1c2740]/40"
      >
        <h2 className="text-lg font-semibold">{companyCopy.accountsTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{companyCopy.accountsBody}</p>
        <input
          ref={fileRef}
          type="file"
          aria-label={companyCopy.accountsChoose}
          accept=".xbrl,.xml,.zip,application/xml,application/zip"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (!file) {
              return;
            }

            void readFile(file);
          }}
          className="sr-only"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            fileRef.current?.click();
          }}
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {companyCopy.accountsChoose}
        </button>
        {pending ? <p className="mt-2 text-sm text-[#5c6b78]">{companyCopy.accountsReading}</p> : null}
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={closeDialog}
            className={compactButtonClass}
          >
            {companyCopy.accountsClose}
          </button>
        </div>
      </dialog>
    </div>
  );
}
