import Link from "next/link";
import { Download, Link2 } from "lucide-react";
import { Card } from "@/components/ui/form";
import { companyPdfCopy } from "@/lib/company-pdf";

export function SellerPdfCard({ shareUrl }: { shareUrl: string | null }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-[#1c2740]">{companyPdfCopy.sellerTitle}</h2>
      <p className="mt-1 text-sm leading-6 text-[#667085]">{companyPdfCopy.sellerBody}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/mi-empresa/pdf/teaser?download=1"
          className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full bg-[#1c2740] px-4 text-sm font-medium text-white hover:bg-[#0f766e]"
        >
          <Download className="size-4" aria-hidden />
          {companyPdfCopy.teaserDownload}
        </Link>
      </div>
      {shareUrl ? (
        <p className="mt-3 break-all text-sm text-[#0f766e]">
          <span className="mb-1 flex items-center gap-1.5 font-medium text-[#1c2740]">
            <Link2 className="size-4" aria-hidden />
            {companyPdfCopy.shareLabel}
          </span>
          <a href={shareUrl} className="underline-offset-2 hover:underline">
            {shareUrl}
          </a>
        </p>
      ) : (
        <p className="mt-3 text-sm text-[#667085]">{companyPdfCopy.shareHint}</p>
      )}
    </Card>
  );
}

export function BuyerDossierLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/proyectos/${slug}/pdf/dossier?download=1`}
      className="inline-flex h-11 min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-[#e7eaee] bg-white px-4 text-sm font-medium text-[#1c2740] hover:border-[#0f766e]"
    >
      <Download className="size-4" aria-hidden />
      {companyPdfCopy.dossierDownload}
    </Link>
  );
}
