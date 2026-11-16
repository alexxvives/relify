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
      {/* S31 (Alex): no Pendiente tag; the clock is centred on the text and the button on the card. */}
      <div
        role="status"
        className="flex max-w-md flex-col gap-3 rounded-2xl border border-[#cfe8e4] bg-white px-5 py-4 text-[#1c2740] shadow-[0_18px_50px_-28px_rgba(28,39,64,0.45)]"
      >
        <div className="flex items-center gap-4">
          <WaitClockIcon />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{companyCopy.sabiPendingTitle}</p>
            <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{companyCopy.sabiPendingBody}</p>
          </div>
        </div>
        <Link
          href="/mi-empresa/detalles"
          className="inline-flex h-10 items-center self-center rounded-full bg-[#1c2740] px-4 text-sm font-semibold text-white hover:bg-[#28375a] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
        >
          {sellerCopy.detailsTitle}
        </Link>
      </div>
    </div>
  );
}
