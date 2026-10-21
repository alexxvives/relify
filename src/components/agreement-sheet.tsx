"use client";

import { agreementPdfDataUrl } from "@/lib/agreement-pdf";

export function AgreementSheet({ text }: { text: string }) {
  const src = agreementPdfDataUrl(text);
  const title = text.split("\n")[0]?.trim() || "Documento";

  return (
    <iframe
      title={title}
      src={src}
      className="h-[36rem] w-full rounded-xl border border-[#e6e9f0] bg-white shadow-[0_10px_24px_-18px_rgba(28,39,64,0.55)]"
    />
  );
}
