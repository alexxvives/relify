"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const unsavedCopy = {
  title: "Tienes cambios sin guardar",
  body: "Si sales ahora, se pierden los cambios de esta página.",
  stay: "Seguir editando",
  discard: "Salir sin guardar",
  save: "Guardar y salir",
} as const;

const secondary =
  "inline-flex h-10 items-center justify-center rounded-xl border border-[#d5dbe3] bg-white px-3 text-sm font-medium text-[#1c2740] hover:bg-[#f4f6f8] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none";

export function UnsavedChangesGuard({
  dirty,
  onSave,
}: {
  dirty: boolean;
  onSave?: (href: string) => void;
}) {
  const router = useRouter();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setHref(next);
    }

    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty]);

  useEffect(() => {
    if (!href) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHref(null);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [href]);

  if (!href) {
    return null;
  }

  const next = href;

  return (
    // t86: compact centred dialog (max 25rem). "Seguir editando" is the X, Esc or a click outside; the two exits sit side by side.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2740]/40 px-4" onClick={() => setHref(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-body"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") setHref(null);
        }}
        className="relative w-[min(25rem,100%)] rounded-2xl bg-white p-5 shadow-xl"
      >
        <button
          type="button"
          autoFocus
          aria-label={unsavedCopy.stay}
          title={unsavedCopy.stay}
          onClick={() => setHref(null)}
          className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full text-[#5c6b78] hover:bg-[#f4f6f8] hover:text-[#1c2740] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
        <h2 id="unsaved-title" className="pr-8 text-base font-semibold text-[#1c2740]">
          {unsavedCopy.title}
        </h2>
        <p id="unsaved-body" className="mt-1 text-sm leading-5 text-[#5c6b78]">{unsavedCopy.body}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {onSave ? null : (
            <button type="button" onClick={() => setHref(null)} className={secondary}>
              {unsavedCopy.stay}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setHref(null);
              router.push(next);
            }}
            className={secondary}
          >
            {unsavedCopy.discard}
          </button>
          {onSave ? (
            <button
              type="button"
              onClick={() => {
                setHref(null);
                onSave(next);
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#465ab4] px-3 text-sm font-medium text-white hover:bg-[#3a4c9c] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
            >
              {unsavedCopy.save}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
