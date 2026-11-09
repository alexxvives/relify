"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/entrar/actions";
import { ArrowRight } from "lucide-react";
import { authSubmitClassName, EmailField, PasswordField } from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";

export function SignInForm({ nextPath = null }: { nextPath?: string | null }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, null);

  return (
    <form action={action} className="flex flex-col gap-4 short:gap-3">
      {nextPath ? <input type="hidden" name="siguiente" value={nextPath} /> : null}
      <EmailField />
      <PasswordField autoComplete="current-password" maxLength={128} placeholder={authCopy.passwordLabel} />
      <Link href="/olvide-contrasena" className="-mt-2 self-end text-sm font-medium text-[#14998a] hover:text-[#0f8578]">
        {authCopy.forgotLink}
      </Link>
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
