"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const unsavedCopy = {
  title: "Tienes cambios sin guardar",
  body: "Si sales ahora, se pierden los cambios de esta página.",
  stay: "Seguir editando",
  discard: "Salir sin guardar",
  save: "Guardar y salir",
} as const;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2740]/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="unsaved-title" className="text-xl font-semibold text-[#1c2740]">
          {unsavedCopy.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{unsavedCopy.body}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setHref(null);
            }}
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#e7eaee] px-4 text-sm font-medium text-[#1c2740]"
          >
            {unsavedCopy.stay}
          </button>
          <button
            type="button"
            onClick={() => {
              setHref(null);
              router.push(next);
            }}
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#e7eaee] px-4 text-sm font-medium text-[#1c2740]"
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
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#465ab4] px-4 text-sm font-medium text-white"
            >
              {unsavedCopy.save}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
