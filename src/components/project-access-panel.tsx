"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { SignBubble } from "@/components/deal-pipeline";
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

export function ConnectControl({
  slug,
  status,
  plan,
  matchesLeft,
  align = "end",
}: {
  slug: string;
  status: ProjectAccessView;
  plan: BuyerPlanName;
  matchesLeft: number | null;
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

  if (plan === "limited" && matchesLeft === 0) {
    return <p className="max-w-xs text-sm text-[#5c6b78]">{accessCopy.matchLimit}</p>;
  }

  if (plan === "limited" && !confirming) {
    return (
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
    );
  }

  return (
    <form action={requestAction} className={stack}>
      <input type="hidden" name="slug" value={slug} />
      {plan === "limited" ? <p className="max-w-xs text-sm text-[#1c2740]">{connectConfirm(matchesLeft ?? 0)}</p> : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="submit" className={buttonClassName} disabled={requestPending}>
          <Link2 className="size-4" aria-hidden />
          {plan === "limited" ? accessCopy.connectYes : accessCopy.connect}
        </button>
        {plan === "limited" ? (
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-[#5c6b78]"
            onClick={() => {
              setConfirming(false);
            }}
          >
            {accessCopy.connectCancel}
          </button>
        ) : null}
      </div>
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
        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-white p-3 text-sm leading-6 whitespace-pre-wrap text-[#1c2740]">
          {agreement}
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

  if (status === "none" || status === "awaiting-seller" || accepted) {
    return null;
  }

  return (
    <section id="firmar" className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="acceso-nda">
      <h2 id="acceso-nda" className="text-xl font-semibold">
        {accessCopy.ndaHeading}
      </h2>
      <div className="mt-4 max-h-80 overflow-y-auto rounded-xl bg-[#f7f8fb] p-4 text-sm leading-6 whitespace-pre-wrap text-[#1c2740]">
        {agreement}
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
