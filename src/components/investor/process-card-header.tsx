import type { ReactNode } from "react";
import { CancelProcessButton } from "@/components/investor/cancel-process-button";
import { ProcessFichaLink } from "@/components/investor/process-ficha-link";

/**
 * S41 (Alex): one header for buyer, seller and admin process cards. The title with its "Tu turno" / "Qué sigue" cue
 * right below it on the left; the card's action buttons always at the top right.
 */
export function ProcessCardHeader({ title, cue, actions }: { title: ReactNode; cue: ReactNode; actions: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4" data-process-card-header>
      <div className="flex min-w-0 flex-col gap-2">
        {title}
        {cue}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end" data-process-card-actions>
        {actions}
      </div>
    </div>
  );
}

/**
 * Mis procesos card actions for buyer and seller: Cancelar proceso · Ver la ficha. S42 (Alex): no "Contacta con un
 * asesor" here (Mi asesor covers it); under 640 px Cancelar proceso is an icon button.
 */
export function ProcessCardActions({
  cancelAccessId,
  fichaHref,
  unread = 0,
}: {
  cancelAccessId: string | null;
  fichaHref: string;
  unread?: number;
}) {
  return (
    <>
      {cancelAccessId ? <CancelProcessButton accessId={cancelAccessId} iconOnPhone /> : null}
      <ProcessFichaLink href={fichaHref} unread={unread} />
    </>
  );
}
