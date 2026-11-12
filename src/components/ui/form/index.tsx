"use client";

import { forwardRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "cn";

/**
 * Relify form kit. One look for every app form: white field, square radius
 * (`--field-radius`), ink text. Inputs forward every native prop, so
 * server actions and FormData keep working unchanged.
 */
export const fieldBase =
  "relify-field w-full min-w-0 rounded-[var(--field-radius)] border border-public-line bg-white text-base text-public-ink outline-none transition-colors placeholder:text-public-muted focus-visible:border-public-ink disabled:cursor-not-allowed disabled:opacity-70 aria-invalid:border-[#c0362c]";

const fieldSize = { sm: "h-9 px-2 text-sm", md: "h-11 px-3" } as const;

type FieldSize = keyof typeof fieldSize;

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-2 text-sm font-medium text-[#2b3b4a]", className)}>
      {label}
      {children}
      {hint ? <span className="text-xs font-normal text-[#667085]">{hint}</span> : null}
      {error ? (
        <span role="alert" className="text-xs font-normal text-[#c0362c]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: FieldSize; icon?: LucideIcon; invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, size = "md", icon: Icon, invalid, ...props }, ref) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"] ? true : undefined}
      className={cn(fieldBase, fieldSize[size], Icon ? "pl-10" : "", className)}
      {...props}
    />
  );

  if (!Icon) {
    return input;
  }

  return (
    <span className="relative block">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8a97a8]" aria-hidden />
      {input}
    </span>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "icon"> & { showLabel: string; hideLabel: string }>(function PasswordInput(
  { className, showLabel, hideLabel, size = "md", invalid, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative block">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        aria-invalid={invalid ? true : undefined}
        className={cn(fieldBase, fieldSize[size], "pr-11", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-[#667085] hover:bg-[#f4f6f9] hover:text-[#2b3b4a]"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </span>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { className, invalid, rows = 4, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} aria-invalid={invalid ? true : undefined} className={cn(fieldBase, "px-3 py-2.5 leading-6", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: FieldSize; invalid?: boolean }>(function Select(
  { className, size = "md", invalid, children, ...props },
  ref,
) {
  return (
    <span className="relative block">
      <select ref={ref} aria-invalid={invalid ? true : undefined} className={cn(fieldBase, fieldSize[size], "appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#667085]" aria-hidden />
    </span>
  );
});

const buttonTone = {
  primary: "bg-[#465ab4] text-white hover:bg-[#3a4c9c]",
  navy: "bg-[#1c2740] text-white hover:bg-[#2a3a5c]",
  teal: "bg-[#14998a] text-white hover:bg-[#0f8578]",
  outline: "border border-[#d5dbe4] bg-white text-[#1c2740] hover:bg-[#f4f6fb]",
  danger: "bg-[#c0362c] text-white hover:bg-[#a52d24]",
  ghost: "text-[#465ab4] hover:bg-[#f4f6fb]",
} as const;

const buttonSize = {
  sm: "h-8 gap-1 rounded-full px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-4 text-base",
  lg: "h-12 gap-2 rounded-full px-5 text-[15px]",
} as const;

export type ButtonTone = keyof typeof buttonTone;

export function buttonClass({ tone = "primary", size = "md", block = false }: { tone?: ButtonTone; size?: keyof typeof buttonSize; block?: boolean } = {}): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4] disabled:cursor-not-allowed disabled:opacity-60",
    buttonTone[tone],
    buttonSize[size],
    block ? "w-full" : "",
  );
}

export function Button({
  tone,
  size,
  block,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; size?: keyof typeof buttonSize; block?: boolean }) {
  return <button type={type} className={cn(buttonClass({ tone, size, block }), className)} {...props} />;
}

export function Card({ className, tone = "default", ...props }: HTMLAttributes<HTMLElement> & { tone?: "default" | "danger" }) {
  return (
    <section
      className={cn("rounded-2xl border bg-white p-5", tone === "danger" ? "border-[#f0c2c2]" : "border-[#e7eaee]", className)}
      {...props}
    />
  );
}

const tagTone = {
  neutral: "bg-[#f4f7ff] text-[#1c2740]",
  teal: "bg-[#e6f6f3] text-[#0f6e63]",
  navy: "bg-[#1c2740] text-white",
  success: "bg-[#e8f6ee] text-[#17663a]",
  danger: "bg-[#fdeeee] text-[#8d2424]",
  warning: "bg-[#fff4e0] text-[#8a5a00]",
} as const;

export function Tag({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tagTone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap", tagTone[tone], className)} {...props} />;
}
