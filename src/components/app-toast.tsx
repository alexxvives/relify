"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export function AppToast({
  message,
  tone = "ok",
  pulse = 0,
}: {
  message: string | null;
  tone?: "ok" | "error";
  pulse?: number;
}) {
  const token = `${message ?? ""}\0${pulse}`;
  const [seen, setSeen] = useState(token);
  const [hidden, setHidden] = useState(false);

  if (token !== seen) {
    setSeen(token);
    setHidden(false);
  }

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setHidden(true);
    }, 4200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message, pulse]);

  if (!message || hidden || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <p
      role={tone === "ok" ? "status" : "alert"}
      className={
        tone === "ok"
          ? "fixed right-6 bottom-6 z-[80] flex w-[min(22rem,calc(100%-3rem))] items-start gap-3 rounded-2xl border border-[#b7e4c7] bg-[#e8f6ee] px-4 py-3 text-sm leading-6 text-[#17663a] shadow-[0_16px_40px_-24px_rgba(23,102,58,0.55)]"
          : "fixed right-6 bottom-6 z-[80] flex w-[min(22rem,calc(100%-3rem))] items-start gap-3 rounded-2xl border border-[#f3c1bd] bg-[#fdecec] px-4 py-3 text-sm leading-6 text-[#7a1f1a] shadow-[0_16px_40px_-24px_rgba(122,31,26,0.45)]"
      }
    >
      {tone === "ok" ? (
        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#17663a] text-white">
          <Check className="size-3" aria-hidden />
        </span>
      ) : null}
      <span>{message}</span>
    </p>,
    document.body,
  );
}
