import { Clock3 } from "lucide-react";
import { companyCopy } from "@/lib/company-copy";

/** Seller side: the CIF is in, the SABI financials are not loaded yet. */
export function SabiPendingNotice() {
  return (
    <section
      role="status"
      className="mb-6 flex items-start gap-4 rounded-2xl border border-[#cfe8e4] bg-[#f0faf8] px-5 py-4 text-[#1c2740]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0f766e] text-white">
        <Clock3 className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {companyCopy.sabiPendingTitle}
          <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 text-xs font-semibold text-[#9a5b00]">{companyCopy.sabiPendingTag}</span>
        </p>
        <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{companyCopy.sabiPendingBody}</p>
      </div>
    </section>
  );
}
