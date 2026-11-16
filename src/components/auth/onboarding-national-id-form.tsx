"use client";

import { useActionState, useState } from "react";
import { completeNationalIdAction, type NationalIdState } from "@/app/onboarding/actions";
import { Input } from "@/components/ui/form";
import { authCopy } from "@/lib/auth-copy";
import { isValidSpanishPersonId } from "@/lib/spanish-cif";

/** S29b: the one onboarding field an older account may be missing before it signs the Acuerdo con Relify. */
export function OnboardingNationalIdForm() {
  const [state, action, pending] = useActionState<NationalIdState, FormData>(completeNationalIdAction, null);
  const [nationalId, setNationalId] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const message = localMessage ?? state?.message ?? null;

  return (
    <form
      action={action}
      className="mx-auto flex w-full max-w-md flex-col gap-5"
      onSubmit={(event) => {
        if (nationalId.trim().length === 0) {
          event.preventDefault();
          setLocalMessage(authCopy.nationalIdRequired);
          return;
        }
        if (!isValidSpanishPersonId(nationalId)) {
          event.preventDefault();
          setLocalMessage(authCopy.nationalIdInvalid);
        }
      }}
    >
      <div>
        <h2 className="text-lg font-semibold text-[#16324f]">{authCopy.nationalIdCompleteTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{authCopy.nationalIdCompleteIntro}</p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-[#1c2740]">
        {authCopy.nationalIdLabel}
        <Input
          name="nationalId"
          type="text"
          autoComplete="off"
          required
          maxLength={12}
          placeholder={authCopy.nationalIdPlaceholder}
          value={nationalId}
          aria-invalid={message !== null}
          aria-describedby={message ? "national-id-error" : undefined}
          onChange={(event) => {
            setNationalId(event.target.value.toUpperCase());
            setLocalMessage(null);
          }}
        />
        {message ? (
          <span id="national-id-error" role="alert" className="text-sm font-normal text-[#c0362c]">
            {message}
          </span>
        ) : null}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-fit items-center self-center rounded-full bg-[#1c2740] px-5 text-sm font-medium text-white transition hover:bg-[#16324f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c2740] disabled:opacity-60"
      >
        {pending ? authCopy.nationalIdCompletePending : authCopy.nationalIdCompleteSubmit}
      </button>
    </form>
  );
}
