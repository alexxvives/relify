"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
          ? "fixed bottom-6 left-1/2 z-[80] w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-[#1c2740] px-4 py-3 text-center text-sm leading-6 text-white shadow-[0_16px_40px_-24px_rgba(28,39,64,0.7)]"
          : "fixed bottom-6 left-1/2 z-[80] w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-[#7a1f1a] px-4 py-3 text-center text-sm leading-6 text-white shadow-[0_16px_40px_-24px_rgba(28,39,64,0.7)]"
      }
    >
      {message}
    </p>,
    document.body,
  );
}
