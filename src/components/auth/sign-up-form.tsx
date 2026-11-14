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
  const selected = intents.find((item) => item.id === role);

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
      <div className="flex flex-col gap-1.5">
        <div
          key={roleAlert}
          className={roleMissing ? "releva-shake flex rounded-full border border-[#d5dee8] bg-[#f7f8fb] p-1" : "flex rounded-full border border-[#d5dee8] bg-[#f7f8fb] p-1"}
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
                    ? "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full bg-[#16324f] px-1 text-[11px] font-medium text-white sm:gap-1.5 sm:px-2 sm:text-sm"
                    : roleMissing
                      ? "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-medium text-[#c0362c] sm:gap-1.5 sm:px-2 sm:text-sm"
                      : "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-medium text-[#5c6b78] sm:gap-1.5 sm:px-2 sm:text-sm"
                }
              >
                <item.Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
        {selected ? (
          <p className="px-1 text-center text-sm leading-5 text-[#7d8fa1]">{authCopy.roleHints[selected.id]}</p>
        ) : null}
      </div>
      <input type="hidden" name="signupRole" value={role} />
      <EmailField look="arc" />
      <NewPasswordField name="password" label={authCopy.passwordLabel} placeholder={authCopy.passwordPlaceholder} />
      <label className="flex items-start gap-2.5 px-1 text-sm leading-5 text-[#5c6b78]">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="mt-0.5 size-4 shrink-0 rounded border-[#c5cdd8] text-[#1c2740] accent-[#1c2740]"
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
