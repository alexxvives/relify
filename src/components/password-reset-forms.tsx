"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  type ForgotState,
  type ResetState,
} from "@/app/olvide-contrasena/actions";
import {
  authSubmitClassName,
  EmailField,
  PasswordField,
} from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex gap-3 rounded-2xl border border-[#7fd6cc] bg-[#effaf8] p-4 text-sm leading-6 text-[#0f766e]"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.sent) {
    return <Notice>{state.message}</Notice>;
  }

  return (
    <form action={action} className="flex flex-col gap-4 short:gap-3">
      <EmailField />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={authSubmitClassName}>
        {pending ? authCopy.forgotPending : authCopy.forgotSubmit}
        {pending ? null : <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    null,
  );

  if (state?.message === "ok") {
    return (
      <div className="flex flex-col gap-4 short:gap-3">
        <Notice>
          Tu contraseña se ha actualizado. Ya puedes entrar con la nueva.
        </Notice>
        <Link href="/entrar" className={authSubmitClassName}>
          Entrar <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  if (!token || state?.invalid) {
    return (
      <div className="flex flex-col gap-4 short:gap-3">
        <p role="alert" className="text-sm text-destructive">
          {authCopy.resetInvalid}
        </p>
        <Link href="/olvide-contrasena" className={authSubmitClassName}>
          {authCopy.resetRequestNew}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 short:gap-3">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        placeholder="Mínimo 8 caracteres"
      />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={authSubmitClassName}>
        {pending ? authCopy.resetPending : authCopy.resetSubmit}
        {pending ? null : <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
