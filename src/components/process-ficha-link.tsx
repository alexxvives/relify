import Link from "next/link";
import { investorCopy } from "@/lib/investor-copy";

export function ProcessFichaLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#465ab4] px-3 text-sm font-semibold text-white">
      {investorCopy.openCompany}
    </Link>
  );
}
