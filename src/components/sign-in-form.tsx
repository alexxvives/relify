"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/entrar/actions";
import { authFieldClassName, authLabelClassName, PasswordField } from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className={authLabelClassName}>
        {authCopy.emailFieldLabel}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={authCopy.emailPlaceholder}
          className={authFieldClassName}
        />
      </label>
      <PasswordField autoComplete="current-password" maxLength={128} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-public-clay text-[15px] text-public-paper transition hover:bg-public-clay-deep disabled:opacity-50"
      >
        {pending ? authCopy.signInPending : authCopy.signInSubmit}
      </button>
    </form>
  );
}
