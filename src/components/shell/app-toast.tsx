"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, X } from "lucide-react";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

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
  const mounted = useIsClient();

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

  if (!message || hidden || !mounted) {
    return null;
  }

  const ok = tone === "ok";

  return createPortal(
    <div
      role={ok ? "status" : "alert"}
      className={
        ok
          ? "releva-app-toast fixed right-5 bottom-5 z-[80] w-[min(36rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#b7e4c7] bg-[#f4fbf7] text-[#14532d] shadow-[0_22px_44px_-22px_rgba(20,83,45,0.45)]"
          : "releva-app-toast fixed right-5 bottom-5 z-[80] w-[min(36rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#f3c1bd] bg-[#fff7f6] text-[#7a1f1a] shadow-[0_22px_44px_-22px_rgba(122,31,26,0.4)]"
      }
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {ok ? null : (
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#c2413a] text-white">
            <CircleAlert className="size-3.5" aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1 pt-0.5 text-sm leading-6 font-medium">{message}</span>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
          }}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-current/70 hover:bg-black/5"
          aria-label="Cerrar"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <div className="h-1 bg-black/5">
        <div className={ok ? "releva-app-toast-bar h-full bg-[#1f8a4c]" : "releva-app-toast-bar h-full bg-[#c2413a]"} />
      </div>
    </div>,
    document.body,
  );
}
