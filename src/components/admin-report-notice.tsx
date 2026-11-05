"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { notifyReportReadyAction } from "@/app/(app)/admin/empresas/[slug]/sabi-actions";
import { InfoHint } from "@/components/ui/info-hint";

/**
 * t73b: "Notificar al vendedor" (informe financiero listo). Enabled only once SABI is imported;
 * asks for confirmation, then shows when and by whom it was sent.
 */
export function AdminReportNotice({
  projectId,
  imported,
  report,
  variant = "page",
}: {
  projectId: string;
  imported: boolean;
  report: { sentAt: string | null; sentBy: string | null; hasOwner: boolean };
  /** t74: "banner" renders a glass pill over the dark company banner, next to the SABI pill. */
  variant?: "page" | "banner";
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sent = report.sentAt !== null;
  const disabled = !imported || !report.hasOwner || pending || sent;

  function send() {
    setError(null);
    start(async () => {
      const result = await notifyReportReadyAction(projectId);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  const banner = variant === "banner";
  const sentLabel = report.sentAt
    ? `Ya se notificó el ${report.sentAt}${report.sentBy ? ` · ${report.sentBy}` : ""}`
    : null;

  const button = (
    <button
      type="button"
      disabled={disabled}
      aria-label={sentLabel ? `Notificar al vendedor. ${sentLabel}` : "Notificar al vendedor"}
      onClick={() => {
        if (!sent) setConfirming(true);
      }}
      className={
        banner
          ? `inline-flex h-8 items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 text-xs font-medium text-white backdrop-blur hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-white/15 disabled:text-white/45 disabled:hover:bg-white/10 ${sent ? "pointer-events-none" : ""}`
          : `inline-flex h-8 items-center gap-2 rounded-full border border-[#0f766e]/30 bg-white px-3 text-xs font-medium text-[#0f766e] hover:bg-[#effaf8] disabled:cursor-not-allowed disabled:border-[#e7eaee] disabled:text-[#9aa5b1] disabled:hover:bg-white ${sent ? "pointer-events-none" : ""}`
      }
    >
      <Mail className="size-3.5" aria-hidden />
      Notificar al vendedor
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {sentLabel ? (
        <InfoHint text={sentLabel} hoverOnly side="top" align="center" width="auto">
          {button}
        </InfoHint>
      ) : (
        button
      )}
      {confirming
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-notice-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2740]/50 p-4"
            >
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2
                  id="report-notice-title"
                  className="text-lg font-semibold text-[#1c2740]"
                >
                  ¿Avisar al vendedor?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#3d4a63]">
                  Le enviaremos un correo diciendo que su informe financiero
                  está listo para revisar.
                  {report.sentAt ? ` Ya se le avisó el ${report.sentAt}.` : ""}
                </p>
                {error ? (
                  <p
                    role="alert"
                    className="mt-3 text-sm font-medium text-[#b42318]"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={pending}
                    className="h-9 rounded-full px-4 text-sm font-medium text-[#3d4a63] hover:bg-[#f2f4f7]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={pending}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-[#0f766e] px-4 text-sm font-semibold text-white hover:bg-[#0c5f59] disabled:opacity-70"
                  >
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Mail className="size-4" aria-hidden />
                    )}
                    {pending ? "Enviando…" : "Enviar aviso"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
