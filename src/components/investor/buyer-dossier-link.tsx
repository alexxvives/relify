import Link from "next/link";
import { Download } from "lucide-react";
import { companyPdfCopy } from "@/lib/company-pdf-copy";
import { loiTemplateCopy } from "@/lib/loi-template-pdf";

export function BuyerDossierLink({ slug, loiAccessId = null }: { slug: string; loiAccessId?: string | null }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Link
        href={`/proyectos/${slug}/pdf/dossier?download=1`}
        className="inline-flex h-11 min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-[#e7eaee] bg-white px-4 text-sm font-medium text-[#1c2740] hover:border-[#0f766e]"
      >
        <Download className="size-4" aria-hidden />
        {companyPdfCopy.dossierDownload}
      </Link>
      {loiAccessId ? (
        <Link
          href={`/acuerdos/loi-plantilla/${loiAccessId}?download=1`}
          className="inline-flex h-11 min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-[#e7eaee] bg-white px-4 text-sm font-medium text-[#1c2740] hover:border-[#0f766e]"
        >
          <Download className="size-4" aria-hidden />
          {loiTemplateCopy.download}
        </Link>
      ) : null}
    </div>
  );
}
