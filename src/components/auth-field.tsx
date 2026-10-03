"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authCopy } from "@/lib/auth-copy";

export const authFieldClassName =
  "h-12 w-full rounded-public border border-public-line bg-public-paper px-4 text-[15px] text-public-ink outline-none placeholder:text-public-muted focus-visible:border-public-clay focus-visible:ring-3 focus-visible:ring-public-clay/25";

export const authLabelClassName = "flex flex-col gap-2 text-sm text-public-ink";

export function PasswordField({
  autoComplete,
  minLength,
  maxLength,
  hint,
}: {
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  maxLength: number;
  hint?: string;
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
          placeholder={authCopy.passwordPlaceholder}
          className={`${authFieldClassName} pr-12`}
        />
        <button
          type="button"
          aria-label={visible ? authCopy.hidePassword : authCopy.showPassword}
          onClick={() => {
            setVisible((current) => !current);
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-public-muted hover:text-public-ink"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </span>
      {hint ? <span className="text-xs font-normal text-public-muted">{hint}</span> : null}
    </label>
  );
}
