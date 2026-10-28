"use client";

import { useActionState, useState } from "react";
import { signUpAction, type SignUpState } from "@/app/registro/actions";
import { ArrowRight } from "lucide-react";
import { NewPasswordField } from "@/components/new-password-field";
import { authSubmitClassName, EmailField } from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";
import { ArcScope } from "@/components/arc/arc-scope";
import { Stepper } from "@/components/arc/stepper/stepper";

const intents = [
  { id: "seller", label: "Empresa" },
  { id: "investor", label: "Comprador" },
  { id: "advisor", label: "Asesor" },
] as const;

// The real path: pick the account type here, then email and password here, then the profile in onboarding.
const signupSteps = [
  { id: "tipo", label: "Tipo de cuenta" },
  { id: "acceso", label: "Email y contraseña" },
  { id: "perfil", label: "Tu perfil" },
];

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
      className="flex flex-col gap-4"
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
      <ArcScope className="mb-1">
        <Stepper steps={signupSteps} current={role === "" ? 0 : 1} compact label="Pasos para crear la cuenta" />
      </ArcScope>
      <div
        key={roleAlert}
        className={roleMissing ? "releva-shake grid grid-cols-3 gap-2" : "grid grid-cols-3 gap-2"}
        role="group"
        aria-label="Empresa, comprador o asesor"
      >
        {intents.map((item) => {
          const selected = role === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setRole(item.id);
                setLocalMessage(null);
              }}
              className={
                selected
                  ? "h-11 rounded-full bg-[#16324f] text-sm font-medium text-white"
                  : roleMissing
                    ? "h-11 rounded-full border-2 border-[#c0362c] bg-white text-sm font-medium text-[#c0362c]"
                    : "h-11 rounded-full border border-[#d5dee8] bg-white text-sm font-medium text-[#5c6b78]"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="signupRole" value={role} />
      <EmailField />
      <NewPasswordField name="password" label={authCopy.passwordLabel} placeholder={authCopy.passwordPlaceholder} />
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
