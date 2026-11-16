"use client";

import { useActionState, useEffect, useState } from "react";
import { postInvestorMessageAction, type ProjectAccessActionState } from "@/app/proyectos/[slug]/actions";
import { AgreementSheet } from "@/components/investor/agreement-sheet";
import { FilePreviewDialog } from "@/components/investor/file-preview-dialog";
import { FileTextIcon } from "@/components/ui/file-text";
import { accessCopy } from "@/lib/access-copy";
import { Card } from "@/components/ui/form";

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

export function LoiCard({
  slug,
  agreement,
  signedBody,
  accessId,
}: {
  slug: string;
  agreement: string;
  signedBody: string | null;
  accessId: string;
}) {
  if (signedBody !== null) {
    return <SignedLoi accessId={accessId} />;
  }

  return <LoiSign slug={slug} agreement={agreement} />;
}

function SignedLoi({ accessId }: { accessId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-6" aria-labelledby="carta-intenciones">
      <h2 id="carta-intenciones" className="text-xl font-semibold">
        {accessCopy.loiHeading}
      </h2>
      <p className="mt-2 text-sm font-medium text-[#17663a]">{accessCopy.loiSigned}</p>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="mt-4 flex w-full max-w-md items-center gap-3 rounded-xl border border-[#e6e9f0] bg-[#f7f8fb] px-4 py-3 text-left hover:border-[#465ab4]/40 hover:bg-white"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eef0fb] text-[#465ab4]">
          <FileTextIcon size={20} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#1c2740]">Carta-de-intenciones.pdf</span>
          <span className="block text-xs text-[#667085]">Firmada en Relify · Ver o descargar</span>
        </span>
      </button>
      <FilePreviewDialog
        file={open ? { fileName: "Carta-de-intenciones.pdf", folder: "Firmado en Relify", href: `/acuerdos/loi/${accessId}` } : null}
        onClose={() => {
          setOpen(false);
        }}
      />
    </Card>
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
