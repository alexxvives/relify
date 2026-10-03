import Link from "next/link";
import { ClipboardList, Compass, FileText, Info, Pencil, TriangleAlert } from "lucide-react";
import { sellerCopy, trendItems } from "@/lib/seller-copy";

const checklist = [
  { label: sellerCopy.checklistCompany, href: "/mi-empresa/detalles", icon: FileText },
  { label: sellerCopy.checklistDeal, href: "/mi-empresa/detalles", icon: ClipboardList },
  { label: sellerCopy.checklistDocs, href: "/mi-empresa/documentos", icon: Pencil },
  { label: sellerCopy.checklistExplore, href: "/tendencias", icon: Compass },
] as const;

export function SellerOverview() {
  const news = trendItems.filter((item) => item.kind === "news").slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl bg-[#fff8db] px-4 py-3 text-[#614d05] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#b58105]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[#2b3b4a]">{sellerCopy.incompleteTitle}</p>
            <p className="text-sm text-[#614d05]">{sellerCopy.incompleteBody}</p>
          </div>
        </div>
        <Link href="/mi-empresa/detalles" className="shrink-0 text-sm font-medium text-[#1c2740] underline">
          {sellerCopy.completeNow}
        </Link>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
        <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sellerCopy.activityTitle}</h2>
          <p className="mt-1 text-sm text-[#667085]">{sellerCopy.activityIntro}</p>
          <div className="mt-4 rounded-xl bg-[#f3f5f8] px-4 py-8 text-center">
            <p className="text-sm font-semibold text-[#1c2740]">{sellerCopy.activityEmpty}</p>
            <p className="mt-1 text-sm text-[#667085]">{sellerCopy.activityEmptyBody}</p>
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#eef1f6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-[#3d4a63]">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {sellerCopy.activityLocked}
            </p>
            <Link href="/mi-empresa/detalles" className="shrink-0 text-sm font-medium text-[#2454d6] underline">
              {sellerCopy.fillInfo}
            </Link>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sellerCopy.unpublished}</h2>
          <div className="mx-auto mt-4 flex w-40 flex-col items-center">
            <svg viewBox="0 0 120 72" className="w-full" aria-hidden>
              <path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="#e6e9f0" strokeWidth="10" strokeLinecap="round" />
            </svg>
            <p className="-mt-8 text-2xl font-semibold text-[#1c2740]">0%</p>
            <p className="text-xs text-[#667085]">{sellerCopy.completedLabel}</p>
          </div>
          <ul className="mt-4 overflow-hidden rounded-xl bg-[#f4f7ff]">
            {checklist.map((item) => (
              <li key={item.label} className="border-t border-[#e6eaf5] first:border-t-0">
                <Link href={item.href} className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#1c2740]">
                  {item.label}
                  <item.icon className="size-4 shrink-0 text-[#667085]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sellerCopy.trendsTitle}</h2>
            <Link href="/tendencias" className="text-sm text-[#667085]">
              {sellerCopy.seeAll} →
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {news.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-xl border border-[#e6e9f0]">
                <div className="h-28 bg-[#d9e2ea]" />
                <div className="p-3">
                  <p className="text-xs text-[#667085]">
                    {item.source} · {item.tag}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-5 text-[#1c2740]">{item.title}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sellerCopy.notificationsTitle}</h2>
          <p className="mt-8 text-sm text-[#667085]">{sellerCopy.notificationsEmpty}</p>
        </section>
      </div>
    </div>
  );
}
