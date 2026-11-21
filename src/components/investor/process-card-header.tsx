import Link from "next/link";
import type { ReactNode } from "react";
import { CancelProcessButton } from "@/components/investor/cancel-process-button";
import { ProcessFichaLink } from "@/components/investor/process-ficha-link";
import { engagementCopy } from "@/lib/engagement-copy";

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

/** S41 (Alex): Mis procesos button order, the same for buyer and seller: Contacta con un asesor · Cancelar proceso · Ver la ficha. */
export function ProcessCardActions({
  advisorHref,
  cancelAccessId,
  fichaHref,
  unread = 0,
}: {
  advisorHref: string | null;
  cancelAccessId: string | null;
  fichaHref: string;
  unread?: number;
}) {
  return (
    <>
      {advisorHref ? (
        <Link
          href={advisorHref}
          data-advisor-link
          className="inline-flex h-9 w-fit items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium whitespace-nowrap text-[#465ab4]"
        >
          {engagementCopy.contactAdvisor}
        </Link>
      ) : null}
      {cancelAccessId ? <CancelProcessButton accessId={cancelAccessId} /> : null}
      <ProcessFichaLink href={fichaHref} unread={unread} />
    </>
  );
}
