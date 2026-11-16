"use client";

import { useMemo } from "react";
import { PdfPages } from "@/components/seller/pdf-pages";
import { agreementPdfDataUrl } from "@/lib/agreement-pdf";

export function AgreementSheet({ text }: { text: string }) {
  const src = useMemo(() => agreementPdfDataUrl(text), [text]);
  const title = text.split("\n")[0]?.trim() || "Documento";

  return (
    <div className="h-[36rem] w-full rounded-xl shadow-[0_10px_24px_-18px_rgba(28,39,64,0.55)]">
      <PdfPages title={title} src={src} />
    </div>
  );
}
