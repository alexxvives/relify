import Link from "next/link";
import { investorCopy } from "@/lib/investor-copy";

/** S40: unread chat messages ride on "Ver la ficha", since the chat now lives in the ficha's Chat / Documentos tab. */
export function ProcessFichaLink({ href, unread = 0 }: { href: string; unread?: number }) {
  return (
    <Link href={href} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#465ab4] px-3 text-sm font-semibold text-white">
      {investorCopy.openCompany}
      {unread > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[#465ab4]" aria-label={`${unread} sin leer`}>
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
