"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText } from "lucide-react";
import { AppToast } from "@/components/shell/app-toast";
import { fireSideCannons } from "@/lib/client/side-cannons";
import { FilePreviewDialog, downloadHref } from "@/components/investor/file-preview-dialog";
import { PdfThumb } from "@/components/seller/pdf-pages";
import { PlatformTermsForm } from "@/components/auth/platform-terms-form";
import { PlatformTermsText } from "@/components/auth/platform-terms-text";
import { platformTermsCopy } from "@/lib/platform-terms";

/** S26b: how long the "Acuerdo firmado" state stays before the dialog closes and the welcome starts. */
export const signedStateMs = 1600;

/**
 * Always mounted in the shell so the welcome survives the refresh that drops `required`.
 * `required`: the user still has to sign (not an admin, agreement not signed).
 */
export function PlatformTermsDialog({ required }: { required: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [stored, setPhase] = useState<"sign" | "signed" | "closed">("sign");
  // Shown at mount: if the shell refreshes to `required=false` mid-flow, finish with the success state.
  const [shownAtMount] = useState(required);
  const phase = stored === "sign" && shownAtMount && !required ? "signed" : stored;
  const fired = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!required || !dialog || dialog.open || phase !== "sign") {
      return;
    }

    dialog.showModal();
  }, [phase, required]);

  useEffect(() => {
    if (phase !== "signed") {
      return;
    }
    const timer = window.setTimeout(() => {
      dialogRef.current?.close();
      setPhase("closed");
      // Once per signature: the welcome confetti and the shell refresh (which drops this dialog).
      if (!fired.current) {
        fired.current = true;
        void fireSideCannons();
        router.refresh();
      }
    }, signedStateMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [phase, router]);

  const onSigned = useCallback(() => {
    setPhase((current) => (current === "sign" ? "signed" : current));
  }, []);

  if (phase === "sign" && !required && !shownAtMount) {
    return null;
  }

  if (phase === "closed") {
    return <AppToast message={`${platformTermsCopy.welcome} ${platformTermsCopy.welcomeBody}`} />;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="platform-terms-title"
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(40rem,calc(100%-1rem))] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl sm:rounded-2xl border-0 bg-white p-4 sm:p-6 text-[#1c2740] open:flex open:flex-col backdrop:bg-[#1c2740]/40"
      onCancel={(event) => {
        event.preventDefault();
      }}
    >
      {phase === "signed" ? (
        <div role="status" aria-live="polite" className="relify-signed-state flex flex-col items-center gap-3 px-2 py-10 text-center sm:py-14">
          <span className="relify-signed-check inline-flex size-16 items-center justify-center rounded-full bg-[#e8f6ee] text-[#17663a]">
            <Check className="size-8" strokeWidth={2.5} aria-hidden />
          </span>
          <h2 id="platform-terms-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
            {platformTermsCopy.signedDone}
          </h2>
          <p className="text-sm leading-6 text-[#5c6b78]">
            {platformTermsCopy.welcome} {platformTermsCopy.welcomeBody}
          </p>
        </div>
      ) : (
        <>
          <h2 id="platform-terms-title" className="text-xl sm:text-2xl font-semibold tracking-tight shrink-0">{platformTermsCopy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5c6b78] shrink-0">{platformTermsCopy.intro}</p>
          <div className="mt-4 sm:mt-5 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#e7eaee] bg-[#fafbfc] px-4 py-4 sm:px-5 sm:py-5 -webkit-overflow-scrolling-touch">
            <PlatformTermsText />
          </div>
          <div className="shrink-0">
            <PlatformTermsForm onSigned={onSigned} />
          </div>
        </>
      )}
    </dialog>
  );
}

export function SignatureDocument({ when }: { when: string }) {
  const [open, setOpen] = useState(false);
  const signedLabel = `${platformTermsCopy.signedTitle} · ${platformTermsCopy.signedOn} ${when}`;

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#d5dbe3] bg-white text-left shadow-[0_12px_30px_-24px_rgba(28,39,64,0.45)]">
        <div className="flex flex-1 flex-col gap-4 p-4 md:hidden">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465ab4]">
              <FileText className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#1c2740]">{platformTermsCopy.signedTitle}</p>
              <p className="mt-1 text-sm text-[#5c6b78]">
                {platformTermsCopy.signedOn} {when}
              </p>
            </div>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-[#3d4a63]">{platformTermsCopy.body[0]}</p>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(true);
              }}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#1c2740] px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4]"
            >
              {platformTermsCopy.viewPdf}
            </button>
            <a
              href={downloadHref("/cuenta/acuerdo")}
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium text-[#1c2740] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4]"
            >
              {platformTermsCopy.downloadPdf}
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
          aria-label={`${signedLabel} · abrir`}
          title={`${platformTermsCopy.signedOn} ${when}`}
          className="group hidden h-full w-full flex-col overflow-hidden text-left transition hover:border-[#465ab4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4] md:flex"
        >
          <span className="relative block min-h-56 flex-1 overflow-hidden bg-white md:min-h-0">
            <span className="absolute inset-0 block transition group-hover:-translate-y-0.5">
              <PdfThumb
                src="/cuenta/acuerdo"
                title={platformTermsCopy.signedTitle}
                fallback={
                  <span className="flex size-full flex-col bg-white p-3">
                    <span className="releva-word text-xs leading-none text-[#1c2740]">Relify</span>
                    <span className="mt-2 line-clamp-6 text-[10px] leading-[1.35] text-[#8b95a7]">{platformTermsCopy.body.join(" ")}</span>
                  </span>
                }
              />
            </span>
          </span>
          <span className="flex items-center gap-1.5 border-t border-[#e7eaee] px-4 py-3 text-sm font-semibold text-[#1c2740]">
            <FileText className="size-4 shrink-0 text-[#465ab4]" aria-hidden />
            {platformTermsCopy.signedTitle}
          </span>
        </button>
      </div>
      <FilePreviewDialog
        file={
          open
            ? {
                fileName: "Acuerdo-con-Relify.pdf",
                folder: platformTermsCopy.signedTitle,
                href: "/cuenta/acuerdo",
              }
            : null
        }
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
