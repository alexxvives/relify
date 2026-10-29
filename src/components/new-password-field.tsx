"use client";

import { useState } from "react";

import { ArcScope } from "@/components/arc/arc-scope";
import { createPasswordRules, PasswordStrength } from "@/components/arc/password-strength/password-strength";

// Advisory only: the server still asks for 8 to 128 characters and nothing more.
const rules = createPasswordRules({
  minLength: 8,
  labels: {
    length: (min) => `Al menos ${min} caracteres`,
    case: "",
    number: "Al menos un número",
    symbol: "Al menos un símbolo",
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

/** `compact` keeps the checklist out of the layout: it floats under the field only while the field is focused. */
export function NewPasswordField({ name, label, placeholder, compact = false }: { name: string; label: string; placeholder?: string; compact?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={compact ? "password-compact" : undefined}
      data-open={compact && focused ? "true" : undefined}
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
