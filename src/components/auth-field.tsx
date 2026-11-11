"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authCopy } from "@/lib/auth-copy";
import { ArcScope } from "@/components/arc/arc-scope";
import { Input as ArcInput } from "@/components/arc/input/input";

export const authFieldClassName =
  "relify-field h-12 w-full text-[15px] text-public-ink placeholder:text-public-muted";

export const authLabelClassName = "flex flex-col gap-1.5 text-sm font-medium text-[#5d7082]";

export const authSubmitClassName =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#14998a] text-[15px] font-medium text-white transition hover:bg-[#0f8578] disabled:opacity-50";

/** `arc` matches the sign-up password field (white, soft border, label above), so both fields read as one set. */
export function EmailField({ look = "pill" }: { look?: "pill" | "arc" } = {}) {
  if (look === "arc") {
    return (
      <ArcScope>
        <ArcInput
          label={authCopy.emailFieldLabel}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={authCopy.emailPlaceholder}
        />
      </ArcScope>
    );
  }

  return (
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
  );
}

export function PasswordField({
  autoComplete,
  minLength,
  maxLength,
  placeholder,
}: {
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  maxLength: number;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={authLabelClassName}>
      {authCopy.passwordLabel}
      <span className="relative">
        <input
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`${authFieldClassName} pr-12`}
        />
        <button
          type="button"
          aria-label={visible ? authCopy.hidePassword : authCopy.showPassword}
          onClick={() => {
            setVisible((current) => !current);
          }}
          className="absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 items-center justify-center text-[#8aa0b2] hover:text-[#16324f]"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </span>
    </label>
  );
}
