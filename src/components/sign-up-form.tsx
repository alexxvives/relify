"use client";

import { useActionState } from "react";
import { signUpAction, type SignUpState } from "@/app/registro/actions";
import { authFieldClassName, authLabelClassName, PasswordField } from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";

export function SignUpForm() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUpAction, null);

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
      <PasswordField autoComplete="new-password" minLength={8} maxLength={128} hint={authCopy.passwordHint} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-public-clay text-[15px] text-public-paper transition hover:bg-public-clay-deep disabled:opacity-50"
      >
        {pending ? authCopy.signUpPending : authCopy.signUpSubmit}
      </button>
    </form>
  );
}
