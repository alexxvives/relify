"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, X } from "lucide-react";

/**
 * S28 (Alex): one toast at a time. Every AppToast that shows a message takes a ticket; only the newest ticket renders, so
 * a second message replaces the first instead of stacking.
 */
let latestTicket = 0;
const ticketListeners = new Set<() => void>();
function takeTicket(): number {
  latestTicket += 1;
  for (const listener of ticketListeners) {
    listener();
  }
  return latestTicket;
}
function useLatestTicket() {
  return useSyncExternalStore(
    (listener) => {
      ticketListeners.add(listener);
      return () => ticketListeners.delete(listener);
    },
    () => latestTicket,
    () => 0,
  );
}

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
  onRetry,
  retryLabel = "Reintentar",
}: {
  message: string | null;
  tone?: "ok" | "error";
  pulse?: number;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const token = `${message ?? ""}\0${pulse}`;
  const [seen, setSeen] = useState(token);
  const [hidden, setHidden] = useState(false);
  const [ticket, setTicket] = useState(0);
  const latest = useLatestTicket();
  const mounted = useIsClient();

  if (token !== seen) {
    setSeen(token);
    setHidden(false);
  }

  useEffect(() => {
    if (!message) {
      return;
    }

    const mine = takeTicket();
    const frame = window.requestAnimationFrame(() => {
      setTicket(mine);
    });
    const timer = window.setTimeout(() => {
      setHidden(true);
    }, 4200);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [message, pulse]);

  if (!message || hidden || !mounted || ticket !== latest) {
    return null;
  }

  const ok = tone === "ok";

  return createPortal(
    <div className="releva-toast-stack" data-tone={ok ? "ok" : "error"}>
      <div
        role={ok ? "status" : "alert"}
        className={ok ? "releva-toast-stack-card releva-toast-stack-ok" : "releva-toast-stack-card releva-toast-stack-error"}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          {ok ? null : (
            <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#c2413a] text-white">
              <CircleAlert className="size-3.5" aria-hidden />
            </span>
          )}
          {/* S28 (Alex): one line on desktop (copies are kept short); phones may wrap but never truncate. */}
          <span className="min-w-0 flex-1 pt-0.5 text-sm leading-6 font-medium lg:whitespace-nowrap">{message}</span>
          {!ok && onRetry ? (
            <button
              type="button"
              onClick={() => {
                setHidden(true);
                onRetry();
              }}
              className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#c2413a] px-3 text-xs font-semibold text-white hover:bg-[#a83731] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2413a]"
            >
              {retryLabel}
            </button>
          ) : null}
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
          <div className={ok ? "releva-app-toast-bar h-full bg-[#17663a]" : "releva-app-toast-bar h-full bg-[#c2413a]"} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
