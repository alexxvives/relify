"use client";

import { useActionState } from "react";
import { signUpAction, type SignUpState } from "@/app/registro/actions";
import { ArrowRight } from "lucide-react";
import { authSubmitClassName, EmailField, PasswordField } from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";

export function SignUpForm() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUpAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <EmailField />
      <PasswordField
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        placeholder={authCopy.passwordPlaceholder}
      />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={authSubmitClassName}>
        {pending ? authCopy.signUpPending : authCopy.signUpSubmit}
        {pending ? null : <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
