"use client";

import { useState } from "react";

import { ArcScope } from "@/components/arc/arc-scope";
import { createPasswordRules, PasswordStrength } from "@/components/arc/password-strength/password-strength";

// Advisory only: the server still asks for 8 to 128 characters and nothing more.
const rules = createPasswordRules({
  minLength: 8,
  labels: {
    length: (min) => `${min} caracteres`,
    case: "",
    number: "Un número",
    symbol: "Un símbolo",
  },
}).filter((rule) => rule.id !== "case");

const messages = {
  levels: { tooShort: "Muy corta", weak: "Débil", fair: "Aceptable", good: "Buena", strong: "Fuerte" },
  showPassword: "Mostrar contraseña",
  meterLabel: "Seguridad de la contraseña",
  noPassword: "Aún sin contraseña",
  rulesLabel: "Requisitos de la contraseña",
  ruleMet: ", cumplido",
  ruleNotMet: ", pendiente",
  remainingPrefix: "faltan",
  remainingSuffix: "",
  summary: ({ label, met, total }: { label: string; met: number; total: number }) => `Seguridad: ${label}. ${met} de ${total} requisitos cumplidos.`,
};

/** `compact` keeps the checklist out of the layout: it floats under the field only while the field is focused. `chips` is one row of green-when-met pills. */
export function NewPasswordField({
  name,
  label,
  placeholder,
  compact = false,
  chips = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  compact?: boolean;
  chips?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState(false);
  return (
    <div
      className={chips ? "password-chips" : compact ? "password-compact" : undefined}
      data-open={compact && focused ? "true" : undefined}
      data-typed={compact && typed ? "true" : undefined}
      onInput={(event) => {
        const target = event.target as HTMLInputElement;
        if (target.type === "password" || target.type === "text") setTyped(target.value.length > 0);
      }}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
    <ArcScope>
      <PasswordStrength
        name={name}
        label={label}
        placeholder={placeholder}
        required
        minLength={8}
        maxLength={128}
        rules={rules}
        messages={messages}
      />
    </ArcScope>
    </div>
  );
}
