"use client";

import { UsersRound } from "lucide-react";
import { OptionSelect } from "@/components/ui/option-select";
import { companyCopy } from "@/lib/company-copy";

/**
 * S40 (Alex): when a company has more than one buyer in process, the seller and a seller-hired advisor pick whose
 * chat, documents and meetings the tabs show. It sits at the right end of the process tab row.
 */
export function BuyerFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  if (options.length < 2) {
    return null;
  }

  return (
    <div className="flex w-full items-center gap-2 sm:w-64" data-buyer-filter>
      <UsersRound className="size-4 shrink-0 text-[#465ab4]" aria-hidden />
      <div className="min-w-0 flex-1">
        <OptionSelect label={companyCopy.buyerFilterLabel} value={value} options={options} onValueChange={onChange} textSize="sm" />
      </div>
    </div>
  );
}
