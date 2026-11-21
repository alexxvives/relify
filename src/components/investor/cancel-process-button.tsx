"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelProjectAccessAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { accessCopy } from "@/lib/access-copy";

export function CancelProcessButton({ accessId, label = accessCopy.cancelProcess }: { accessId: string; label?: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ProjectAccessActionState, FormData>(cancelProjectAccessAction, null);
  const shown = open && state?.ok !== true;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (shown && !dialog.open) {
      dialog.showModal();
    }
    if (!shown && dialog.open) {
      dialog.close();
    }
  }, [shown]);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="inline-flex h-9 items-center rounded-full border border-[#f3c7c4] bg-white px-3 text-sm font-medium text-[#c0362c]"
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white p-6 text-[#1c2740] open:block backdrop:bg-[#1c2740]/40"
        onClose={() => {
          if (!state?.ok) {
            setOpen(false);
          }
        }}
      >
        <h2 className="text-lg font-semibold">{accessCopy.cancelTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{accessCopy.cancelBody}</p>
        <form action={action} className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <input type="hidden" name="accessId" value={accessId} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center rounded-full bg-[#c0362c] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Cancelando…" : accessCopy.cancelYes}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
            className="inline-flex h-10 items-center rounded-full border border-[#e7eaee] bg-white px-4 text-sm font-medium"
          >
            {accessCopy.cancelNo}
          </button>
        </form>
        {state && !state.ok ? (
          <p role="alert" className="mt-3 text-sm text-[#c0362c]">
            {state.message}
          </p>
        ) : null}
      </dialog>
    </>
  );
}
