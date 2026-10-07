"use client";

import { useActionState } from "react";
import { postInvestorMessageAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { accessCopy } from "@/lib/access-copy";

const buttonClassName =
  "inline-flex h-11 items-center justify-center rounded-xl bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60";

function SignError({ state }: { state: ProjectAccessActionState }) {
  if (!state || state.ok) {
    return null;
  }

  return (
    <p className="text-sm text-red-700" role="alert">
      {state.message}
    </p>
  );
}

export function LoiCard({ slug, agreement, signedBody }: { slug: string; agreement: string; signedBody: string | null }) {
  if (signedBody !== null) {
    return (
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="carta-intenciones">
        <h2 id="carta-intenciones" className="text-xl font-semibold">
          {accessCopy.loiHeading}
        </h2>
        <p className="mt-2 text-sm font-medium text-[#17663a]">{accessCopy.loiSigned}</p>
        <div className="mt-4 rounded-xl bg-[#f7f8fb] p-4 text-sm leading-6 whitespace-pre-wrap text-[#1c2740]">{signedBody}</div>
      </section>
    );
  }

  return <LoiSign slug={slug} agreement={agreement} />;
}

function LoiSign({ slug, agreement }: { slug: string; agreement: string }) {
  const [state, action, pending] = useActionState(postInvestorMessageAction, null);

  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="carta-intenciones">
      <h2 id="carta-intenciones" className="text-xl font-semibold">
        {accessCopy.loiHeading}
      </h2>
      <div className="mt-4 max-h-80 overflow-y-auto rounded-xl bg-[#f7f8fb] p-4 text-sm leading-6 whitespace-pre-wrap text-[#1c2740]">
        {agreement}
      </div>
      <form action={action} className="mt-4 flex flex-col items-start gap-3">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="kind" value="offer" />
        <input type="hidden" name="body" value={agreement} />
        <button type="submit" className={buttonClassName} disabled={pending}>
          {accessCopy.signLoi}
        </button>
        <SignError state={state} />
      </form>
    </section>
  );
}
