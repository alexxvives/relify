"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Link2, UserRound } from "lucide-react";
import { AgreementSheet } from "@/components/agreement-sheet";
import { SignBubble } from "@/components/deal-pipeline";
import { useModalScrollLock } from "@/components/file-preview-dialog";
import { acceptNdaAction, requestProjectAccessAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { accessCopy, connectConfirm } from "@/lib/access-copy";
import { billingCopy } from "@/lib/billing-copy";
import type { BuyerPlanName } from "@/lib/billing";
import type { ProjectAccessView } from "@/lib/project-access";

const buttonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60";

function AccessError({ state }: { state: ProjectAccessActionState }) {
  if (!state || state.ok) {
    return null;
  }

  return (
    <p className="text-sm text-red-700" role="alert">
      {state.message}
    </p>
  );
}

function ConnectConfirm({
  slug,
  title,
  matchesLeft,
  onClose,
}: {
  slug: string;
  title: string;
  matchesLeft: number;
  onClose: () => void;
}) {
  const [requestState, requestAction, requestPending] = useActionState(requestProjectAccessAction, null);
  useModalScrollLock(true);

  if (requestState?.ok === true) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1224]/55 p-4">
      <form action={requestAction} className="w-full max-w-sm rounded-2xl bg-white p-6 text-[#1c2740] shadow-xl">
        <input type="hidden" name="slug" value={slug} />
        {title.length > 0 ? <p className="text-lg font-semibold">{title}</p> : null}
        <p className="mt-2 text-sm leading-6 text-[#3d4a63]">{connectConfirm(matchesLeft)}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-[#5c6b78]">
            {accessCopy.connectCancel}
          </button>
          <button type="submit" className={buttonClassName} disabled={requestPending}>
            <Link2 className="size-4" aria-hidden />
            {accessCopy.connectYes}
          </button>
        </div>
        <AccessError state={requestState} />
      </form>
    </div>,
    document.body,
  );
}

export function ConnectControl({
  slug,
  status,
  plan,
  matchesLeft,
  profileComplete = true,
  title = "",
  align = "end",
}: {
  slug: string;
  status: ProjectAccessView;
  plan: BuyerPlanName;
  matchesLeft: number | null;
  profileComplete?: boolean;
  title?: string;
  align?: "end" | "center";
}) {
  const [requestState, requestAction, requestPending] = useActionState(requestProjectAccessAction, null);
  const [confirming, setConfirming] = useState(false);
  const accepted = status === "accepted";
  const requested = accepted || status === "requested" || status === "awaiting-seller" || requestState?.ok === true;
  const stack = align === "center" ? "flex flex-col items-center gap-2" : "flex flex-col items-end gap-2";

  if (accepted || requested) {
    return null;
  }

  if (plan === "none") {
    return (
      <Link href="/premium" className={buttonClassName}>
        <Link2 className="size-4" aria-hidden />
        {billingCopy.seePlans}
      </Link>
    );
  }

  if (!profileComplete) {
    return (
      <div className={`${stack} max-w-xs`} role="note">
        <p className={align === "center" ? "text-center text-sm leading-6 text-[#5c6b78]" : "text-right text-sm leading-6 text-[#5c6b78]"}>{accessCopy.profileRequired}</p>
        <Link href="/inversor/perfil" className={buttonClassName}>
          <UserRound className="size-4" aria-hidden />
          {accessCopy.profileRequiredAction}
        </Link>
      </div>
    );
  }

  if (plan === "limited" && matchesLeft === 0) {
    return <p className="max-w-xs text-sm text-[#5c6b78]">{accessCopy.matchLimit}</p>;
  }

  if (plan === "limited") {
    return (
      <>
        <button
          type="button"
          className={buttonClassName}
          onClick={() => {
            setConfirming(true);
          }}
        >
          <Link2 className="size-4" aria-hidden />
          {accessCopy.connect}
        </button>
        {confirming ? (
          <ConnectConfirm slug={slug} title={title} matchesLeft={matchesLeft ?? 0} onClose={() => setConfirming(false)} />
        ) : null}
      </>
    );
  }

  return (
    <form action={requestAction} className={stack}>
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className={buttonClassName} disabled={requestPending}>
        <Link2 className="size-4" aria-hidden />
        {accessCopy.connect}
      </button>
      <AccessError state={requestState} />
    </form>
  );
}

export function NdaSignBubble({ slug, agreement }: { slug: string; agreement: string }) {
  const [acceptState, acceptAction, acceptPending] = useActionState(acceptNdaAction, null);
  const [open, setOpen] = useState(false);

  if (acceptState?.ok === true) {
    return null;
  }

  return (
    <SignBubble fileName="Acuerdo-de-confidencialidad.pdf" body="Ábrelo, léelo y fírmalo desde aquí. El chat se abre en cuanto quede firmado.">
      <button
        type="button"
        className="text-sm font-semibold text-[#465ab4] hover:underline"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        {open ? "Cerrar documento" : "Abrir documento"}
      </button>
      {open ? (
        <div className="mt-2 max-h-72 overflow-y-auto">
          <AgreementSheet text={agreement} />
        </div>
      ) : null}
      <form action={acceptAction} className="mt-3 flex flex-col items-start gap-2">
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className={buttonClassName} disabled={acceptPending}>
          {accessCopy.acceptAction}
        </button>
        <AccessError state={acceptState} />
      </form>
    </SignBubble>
  );
}

export function ProjectAccessPanel({
  slug,
  status,
  agreement,
}: {
  slug: string;
  status: ProjectAccessView;
  agreement: string;
}) {
  const [acceptState, acceptAction, acceptPending] = useActionState(acceptNdaAction, null);
  const accepted = status === "accepted" || acceptState?.ok === true;

  useEffect(() => {
    if (window.location.hash !== "#firmar") {
      return;
    }

    document.getElementById("firmar")?.scrollIntoView({ block: "center" });
  }, []);

  if (status === "none" || status === "awaiting-seller" || accepted) {
    return null;
  }

  return (
    <section id="firmar" className="scroll-mt-8 rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="acceso-nda">
      <h2 id="acceso-nda" className="text-xl font-semibold">
        {accessCopy.ndaHeading}
      </h2>
      <div className="mt-4 max-h-96 overflow-y-auto">
        <AgreementSheet text={agreement} />
      </div>
      <form action={acceptAction} className="mt-4 flex flex-col items-start gap-3">
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className={buttonClassName} disabled={acceptPending}>
          {accessCopy.acceptAction}
        </button>
        <AccessError state={acceptState} />
      </form>
    </section>
  );
}
