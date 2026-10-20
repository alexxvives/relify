"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/entrar/actions";
import { ArrowRight } from "lucide-react";
import { authSubmitClassName, EmailField, PasswordField } from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <EmailField />
      <PasswordField autoComplete="current-password" maxLength={128} placeholder={authCopy.passwordLabel} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={authSubmitClassName}>
        {pending ? authCopy.signInPending : authCopy.signInSubmit}
        {pending ? null : <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
