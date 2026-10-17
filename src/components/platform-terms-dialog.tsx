"use client";

import { useEffect, useRef } from "react";
import { PlatformTermsForm } from "@/components/platform-terms-form";
import { platformTermsCopy } from "@/lib/platform-terms";

export function PlatformTermsDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white p-6 text-[#1c2740] backdrop:bg-[#1c2740]/40"
      onCancel={(event) => {
        event.preventDefault();
      }}
    >
      <h2 className="text-2xl font-semibold tracking-tight">{platformTermsCopy.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{platformTermsCopy.intro}</p>
      <div className="mt-4 flex max-h-[50vh] flex-col gap-3 overflow-y-auto text-sm leading-6">
        {platformTermsCopy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <PlatformTermsForm />
    </dialog>
  );
}
