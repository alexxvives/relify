"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readAnnualAccountsAction, type AnnualAccountsState } from "@/app/(app)/mi-empresa/accounts-actions";
import { verifyCompanyNifAction, type VerifyNifState } from "@/app/(app)/mi-empresa/nif-actions";
import { companyCopy } from "@/lib/company-copy";
import { Input } from "@/components/ui/form";

export function CompanySetup({
  cif,
  onApply,
  onClose,
}: {
  cif: string;
  onApply: (result: Extract<AnnualAccountsState, { ok: true }>) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [nif, setNif] = useState(cif);
  const [nifState, nifAction, nifPending] = useActionState<VerifyNifState, FormData>(verifyCompanyNifAction, null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const step = nifState?.ok || cif.trim().length > 0 ? "accounts" : "nif";

  const refreshed = useRef(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (nifState?.ok && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [nifState, router]);

  function finish() {
    dialogRef.current?.close();
    onClose();
    router.replace("/mi-empresa/detalles");
  }

  async function readFile(file: File) {
    setPending(true);
    setError(null);
    const data = new FormData();
    data.set("accounts", file);
    const result = await readAnnualAccountsAction(data);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    onApply(result);
    finish();
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] open:block backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <p className="text-xs font-medium text-[#5c6b78]">
        {step === "nif" ? companyCopy.setupNifStep : companyCopy.setupAccountsStep}
      </p>
      <h2 className="mt-2 text-lg font-semibold">{step === "nif" ? companyCopy.nifTitle : companyCopy.accountsTitle}</h2>
      {step === "nif" ? (
        <form action={nifAction} className="mt-4">
          <p className="text-sm leading-6 text-[#5c6b78]">{companyCopy.nifIntro}</p>
          <label className="mt-4 block text-sm font-medium" htmlFor="setup-nif">
            {companyCopy.nifLabel}
          </label>
          <Input
            id="setup-nif"
            name="nif"
            value={nif}
            autoComplete="off"
            required
            onChange={(event) => {
              setNif(event.target.value);
            }}
            className="mt-2"
          />
          {nifState && !nifState.ok ? <p className="mt-2 text-sm text-red-700">{nifState.message}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={finish} className="inline-flex h-11 items-center rounded-xl px-4 text-sm">
              {companyCopy.setupLater}
            </button>
            <button
              type="submit"
              disabled={nifPending}
              className="inline-flex h-11 items-center rounded-xl bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {nifPending ? companyCopy.nifPending : companyCopy.nifSubmit}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <p className="text-sm leading-6 text-[#5c6b78]">{companyCopy.accountsBody}</p>
          <input
            ref={fileRef}
            type="file"
            aria-label={companyCopy.accountsChoose}
            accept=".xbrl,.xml,.zip,application/xml,application/zip"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void readFile(file);
              }
            }}
            className="sr-only"
          />
          {pending ? <p className="mt-3 text-sm text-[#5c6b78]">{companyCopy.accountsReading}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={finish} className="inline-flex h-11 items-center rounded-xl px-4 text-sm">
              {companyCopy.setupLater}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                fileRef.current?.click();
              }}
              className="inline-flex h-11 items-center rounded-xl bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {companyCopy.accountsChoose}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
