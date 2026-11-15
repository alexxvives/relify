"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpAction, type SignUpState } from "@/app/registro/actions";
import { ArrowRight, Briefcase, Building2, Handshake } from "lucide-react";
import { NewPasswordField } from "@/components/auth/new-password-field";
import { authSubmitClassName, EmailField } from "@/components/auth/auth-field";
import { authCopy } from "@/lib/auth-copy";

const intents = [
  { id: "seller", label: "Empresa", Icon: Building2 },
  { id: "investor", label: "Comprador", Icon: Briefcase },
  { id: "advisor", label: "Asesor", Icon: Handshake },
] as const;

export type SignupIntent = (typeof intents)[number]["id"];

export function SignUpForm({ intent = null }: { intent?: SignupIntent | null }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUpAction, null);
  const [role, setRole] = useState<SignupIntent | "">(intent ?? "");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [roleAlert, setRoleAlert] = useState(0);
  const roleMissing = roleAlert > 0 && role === "";

  return (
    <form
      action={action}
      className="flex flex-col gap-4 short:gap-3"
      onSubmit={(event) => {
        if (role === "") {
          event.preventDefault();
          setLocalMessage(null);
          setRoleAlert((current) => current + 1);
          return;
        }
        setLocalMessage(null);
      }}
    >
      <div
        key={roleAlert}
        className={
          roleMissing
            ? "releva-shake grid grid-cols-3 gap-1 rounded-2xl border border-[#c0362c] bg-white p-1"
            : "grid grid-cols-3 gap-1 rounded-2xl border border-[#d5dee8] bg-white p-1"
        }
        role="radiogroup"
        aria-label={authCopy.roleChoiceLabel}
      >
        {intents.map((item) => {
          const pressed = role === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={pressed}
              onClick={() => {
                setRole(item.id);
                setLocalMessage(null);
              }}
              className={
                pressed
                  ? "inline-flex min-h-9 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#1c2740] px-1 py-1.5 text-center text-[10px] leading-tight font-semibold text-white min-[380px]:min-h-10 min-[380px]:flex-row min-[380px]:gap-1 min-[380px]:text-[11px] sm:min-h-11 sm:gap-1.5 sm:px-2 sm:text-sm"
                  : roleMissing
                    ? "inline-flex min-h-9 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center text-[10px] leading-tight font-semibold text-[#c0362c] min-[380px]:min-h-10 min-[380px]:flex-row min-[380px]:gap-1 min-[380px]:text-[11px] sm:min-h-11 sm:gap-1.5 sm:px-2 sm:text-sm"
                    : "inline-flex min-h-9 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center text-[10px] leading-tight font-semibold text-[#5c6b78] hover:bg-[#f7f8fb] hover:text-[#1c2740] min-[380px]:min-h-10 min-[380px]:flex-row min-[380px]:gap-1 min-[380px]:text-[11px] sm:min-h-11 sm:gap-1.5 sm:px-2 sm:text-sm"
              }
            >
              <item.Icon className="size-3 shrink-0 min-[380px]:size-3.5 sm:size-4" aria-hidden />
              <span className="min-w-0">{item.label}</span>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="signupRole" value={role} />
      <EmailField look="arc" />
      <NewPasswordField name="password" label={authCopy.passwordLabel} placeholder={authCopy.passwordPlaceholder} chips />
      <label className="flex items-center gap-2 px-1 text-[11px] leading-4 text-[#5c6b78] sm:text-xs sm:leading-4">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="size-3.5 shrink-0 rounded border-[#c5cdd8] text-[#1c2740] accent-[#1c2740] sm:size-4"
        />
        <span>
          {authCopy.termsAcceptLead}{" "}
          <Link href="/terminos" className="font-medium text-[#465ab4] underline-offset-2 hover:underline">
            {authCopy.termsAcceptTerms}
          </Link>{" "}
          {authCopy.termsAcceptAnd}{" "}
          <Link href="/privacidad" className="font-medium text-[#465ab4] underline-offset-2 hover:underline">
            {authCopy.termsAcceptPrivacy}
          </Link>
          .
        </span>
      </label>
      {localMessage || state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {localMessage ?? state?.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={authSubmitClassName}
        onClick={(event) => {
          if (role === "") {
            event.preventDefault();
            setLocalMessage(null);
            setRoleAlert((current) => current + 1);
          }
        }}
      >
        {pending ? authCopy.signUpPending : authCopy.signUpSubmit}
        {pending ? null : <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
