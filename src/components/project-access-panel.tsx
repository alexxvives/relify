"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { acceptNdaAction, requestProjectAccessAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { accessCopy } from "@/lib/access-copy";
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
}: {
  slug: string;
  status: ProjectAccessView;
  plan: BuyerPlanName;
}) {
  const [requestState, requestAction, requestPending] = useActionState(requestProjectAccessAction, null);
  const accepted = status === "accepted";
  const requested = accepted || status === "requested" || status === "awaiting-seller" || requestState?.ok === true;

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

  return (
    <form action={requestAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className={buttonClassName} disabled={requestPending}>
        <Link2 className="size-4" aria-hidden />
        {accessCopy.connect}
      </button>
      <AccessError state={requestState} />
    </form>
  );
}

export function ProjectAccessPanel({ slug, status }: { slug: string; status: ProjectAccessView }) {
  const [acceptState, acceptAction, acceptPending] = useActionState(acceptNdaAction, null);
  const accepted = status === "accepted" || acceptState?.ok === true;

  if (status === "none" || status === "awaiting-seller" || accepted) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="acceso-nda">
      <h2 id="acceso-nda" className="flex items-center gap-2 text-xl font-semibold">
        <Link2 className="size-5 text-[#3d34b8]" aria-hidden />
        {accessCopy.ndaHeading}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5c6b78]">{accessCopy.ndaBody}</p>
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
