"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { authCopy } from "@/lib/auth-copy";
import { ArcScope } from "@/components/arc/arc-scope";
import { Input as ArcInput } from "@/components/arc/input/input";

export const authFieldClassName =
  "h-12 w-full rounded-full border border-[#e4edf2] bg-[#f7fafb] pr-12 pl-11 text-[15px] text-[#16324f] outline-none placeholder:text-[#8aa0b2] focus-visible:border-[#14998a] focus-visible:ring-3 focus-visible:ring-[#14998a]/20";

export const authLabelClassName = "flex flex-col gap-1.5 text-[13px] font-medium text-[#5d7082]";

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
      <span className="relative">
        <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8aa0b2]" aria-hidden />
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={authCopy.emailPlaceholder}
          className={authFieldClassName}
        />
      </span>
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
        <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8aa0b2]" aria-hidden />
        <input
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          className={authFieldClassName}
        />
        <button
          type="button"
          aria-label={visible ? authCopy.hidePassword : authCopy.showPassword}
          onClick={() => {
            setVisible((current) => !current);
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8aa0b2] hover:text-[#16324f]"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </span>
    </label>
  );
}
