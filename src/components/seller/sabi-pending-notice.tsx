import Link from "next/link";
import { WaitClockIcon } from "@/components/seller/nif-ready-icons";
import { companyCopy } from "@/lib/company-copy";
import { sellerCopy } from "@/lib/seller-copy";

/**
 * Seller side: the CIF is in, the SABI financials are not loaded yet.
 * Sits over the (placeholder) financial charts so the wait reads where the numbers will appear.
 */
export function SabiPendingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 p-4 backdrop-blur-[2px]">
      <div
        role="status"
        className="flex max-w-md items-start gap-4 rounded-2xl border border-[#cfe8e4] bg-white px-5 py-4 text-[#1c2740] shadow-[0_18px_50px_-28px_rgba(28,39,64,0.45)]"
      >
        <WaitClockIcon />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {companyCopy.sabiPendingTitle}
            <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 text-xs font-semibold text-[#9a5b00]">{companyCopy.sabiPendingTag}</span>
          </p>
          <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{companyCopy.sabiPendingBody}</p>
          <Link
            href="/mi-empresa/detalles"
            className="mt-3 inline-flex h-10 items-center rounded-full bg-[#1c2740] px-4 text-sm font-semibold text-white hover:bg-[#28375a]"
          >
            {sellerCopy.detailsTitle}
          </Link>
        </div>
      </div>
    </div>
  );
}
