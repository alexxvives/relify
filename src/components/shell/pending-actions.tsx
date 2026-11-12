import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import { pendingHeading } from "@/lib/investor-copy";

export function PendingActions({
  items,
  empty,
  columns = 1,
  side = false,
}: {
  items: HomePendingAction[];
  empty: string;
  columns?: 1 | 2 | 4;
  side?: boolean;
}) {
  if (side) {
    // Right column of Inicio, under the profile progress: fills the remaining height and scrolls.
    return (
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">Acciones pendientes</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-[#64748b]">{empty}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-[#64748b]">{pendingHeading(items.length)}</p>
            <ul className="mt-4 flex min-h-0 flex-col gap-2 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6e9f0] bg-[#f4f7ff] px-3 py-3 hover:bg-[#e8eefc]">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#1c2740]">{item.title}</span>
                      <span className="mt-1 block truncate text-sm text-[#64748b]">{item.detail}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-[#465ab4]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    );
  }
  const listClass =
    columns === 4
      ? "mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
      : columns === 2
        ? "mt-4 grid gap-2 sm:grid-cols-2"
        : "mt-4 flex flex-col gap-2";

  const emptySection = items.length === 0;

  if (emptySection) {
    // Nothing to do: a slim line instead of a big empty card at the top of Inicio.
    return (
      <section className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl border border-[#e7eaee] bg-white px-5 py-3">
        <h2 className="text-base font-semibold text-[#2b3b4a]">Acciones pendientes</h2>
        <p className="text-sm text-[#64748b]">{empty}</p>
      </section>
    );
  }

  return (
    <section
      className={
        emptySection
          ? "w-full min-h-[8.5rem] rounded-2xl border border-[#e7eaee] bg-white p-5"
          : "w-full rounded-2xl border border-[#e7eaee] bg-white p-5"
      }
    >
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">Acciones pendientes</h2>
      {emptySection ? (
        <p className="mt-4 text-sm text-[#64748b]">{empty}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-[#64748b]">{pendingHeading(items.length)}</p>
          <ul className={columns === 1 ? "mt-4 flex flex-wrap gap-3" : listClass}>
            {items.map((item) => (
              <li key={item.id} className={columns === 1 ? "w-72 max-w-full" : undefined}>
                <Link href={item.href} className="flex h-full items-center justify-between gap-3 rounded-2xl border border-[#e6e9f0] bg-[#f4f7ff] px-3 py-3 hover:bg-[#e8eefc]">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#1c2740]">{item.title}</span>
                    <span className="mt-1 block text-sm text-[#64748b]">{item.detail}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-[#465ab4]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
