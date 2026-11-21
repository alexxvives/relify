import Link from "next/link";
import { investorCopy } from "@/lib/investor-copy";

/** S40: "Ver la ficha" on every process card. S43 (Alex): no unread bubble on it; unread chats open the counterparty tab. */
export function ProcessFichaLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#465ab4] px-3 text-sm font-semibold text-white">
      {investorCopy.openCompany}
    </Link>
  );
}
