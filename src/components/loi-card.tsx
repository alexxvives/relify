"use client";

import { useActionState, useEffect, useState } from "react";
import { postInvestorMessageAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { AgreementSheet } from "@/components/agreement-sheet";
import { SignBubble } from "@/components/deal-pipeline";
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
        <div className="mt-4">
          <AgreementSheet text={signedBody} />
        </div>
      </section>
    );
  }

  return <LoiSign slug={slug} agreement={agreement} />;
}

export function LoiSignBubble({ slug, agreement }: { slug: string; agreement: string }) {
  const [state, action, pending] = useActionState(postInvestorMessageAction, null);
  const [open, setOpen] = useState(false);

  return (
    <SignBubble fileName="Carta-de-intenciones.pdf" body="Ábrela, léela y fírmala desde aquí. No hace falta salir del chat.">
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
      <form action={action} className="mt-3 flex flex-col items-start gap-2">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="kind" value="offer" />
        <input type="hidden" name="body" value={agreement} />
        <button type="submit" className={buttonClassName} disabled={pending}>
          {accessCopy.signLoi}
        </button>
        <SignError state={state} />
      </form>
    </SignBubble>
  );
}

function LoiSign({ slug, agreement }: { slug: string; agreement: string }) {
  const [state, action, pending] = useActionState(postInvestorMessageAction, null);

  useEffect(() => {
    if (window.location.hash !== "#firmar") {
      return;
    }

    document.getElementById("firmar")?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <section id="firmar" className="scroll-mt-8 rounded-2xl border border-[#e6e9f0] bg-white p-6" aria-labelledby="carta-intenciones">
      <h2 id="carta-intenciones" className="text-xl font-semibold">
        {accessCopy.loiHeading}
      </h2>
      <div className="mt-4 max-h-96 overflow-y-auto">
        <AgreementSheet text={agreement} />
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
