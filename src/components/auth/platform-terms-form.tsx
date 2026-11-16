"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { acceptPlatformTermsAction, type TermsState } from "@/app/acuerdo/actions";
import { SignaturePad } from "@/components/investor/signature-pad";
import { platformTermsCopy } from "@/lib/platform-terms";

/**
 * `onSigned` (the shell dialog) shows the success state; without it (the standalone /acuerdo page) a
 * saved signature goes to the role home. Either way it fires once per signature.
 */
export function PlatformTermsForm({ onSigned }: { onSigned?: () => void } = {}) {
  const [state, action, pending] = useActionState<TermsState, FormData>(acceptPlatformTermsAction, null);
  const router = useRouter();
  const handled = useRef<TermsState>(null);

  useEffect(() => {
    if (!state?.ok || handled.current === state) {
      return;
    }
    handled.current = state;
    if (onSigned) {
      onSigned();
    } else {
      router.replace(state.home);
    }
  }, [onSigned, router, state]);
  const [signature, setSignature] = useState("");
  const [needsSignature, setNeedsSignature] = useState(false);

  function submit(event: { preventDefault: () => void }) {
    if (signature.length === 0) {
      event.preventDefault();
      setNeedsSignature(false);
      window.requestAnimationFrame(() => {
        setNeedsSignature(true);
      });
    }
  }

  return (
    <form action={action} onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="signature" value={signature} />
      <SignaturePad
        invalid={needsSignature}
        onChange={(value) => {
          setSignature(value);
          if (value.length > 0) {
            setNeedsSignature(false);
          }
        }}
      />
      {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
      {needsSignature ? (
        <p role="alert" className="text-sm text-[#c0362c]">
          {platformTermsCopy.signRequired}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-fit items-center self-center rounded-full bg-[#1c2740] px-5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? platformTermsCopy.pending : platformTermsCopy.accept}
      </button>
    </form>
  );
}
