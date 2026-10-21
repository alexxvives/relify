"use client";

import { useActionState, useState } from "react";
import { signUpAction, type SignUpState } from "@/app/registro/actions";
import { ArrowRight } from "lucide-react";
import { authSubmitClassName, EmailField, PasswordField } from "@/components/auth-field";
import { authCopy } from "@/lib/auth-copy";

const intents = [
  { id: "seller", label: "Empresa" },
  { id: "investor", label: "Inversor" },
] as const;

export function SignUpForm({ intent = null }: { intent?: "seller" | "investor" | null }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUpAction, null);
  const [role, setRole] = useState<(typeof intents)[number]["id"] | "">(intent ?? "");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Empresa o inversor">
        {intents.map((item) => {
          const selected = role === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setRole(item.id);
              }}
              className={
                selected
                  ? "h-11 rounded-full bg-[#16324f] text-sm font-medium text-white"
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
