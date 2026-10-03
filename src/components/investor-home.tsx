import Link from "next/link";
import { ArrowRight, CircleHelp, Crown, EyeOff, Heart, SlidersHorizontal } from "lucide-react";
import { investorCopy } from "@/lib/investor-copy";
import type { NotificationView } from "@/lib/notifications";
import { trendItems } from "@/lib/seller-copy";

const checklist = [
  { label: investorCopy.thesisItem, href: "/inversor/perfil", icon: CircleHelp },
  { label: investorCopy.filtersItem, href: "/busquedas", icon: SlidersHorizontal },
  { label: investorCopy.hideItem, href: "/ocultas", icon: EyeOff },
  { label: investorCopy.favoriteItem, href: "/favoritos", icon: Heart },
  { label: investorCopy.premiumItem, href: "/cuenta", icon: Crown },
] as const;

const stats = [
  investorCopy.visited,
  investorCopy.interestsSent,
  investorCopy.questionsSent,
  investorCopy.meetingsDone,
] as const;

export function InvestorHome({ notifications }: { notifications: NotificationView[] }) {
  const news = trendItems.filter((item) => item.kind === "news").slice(0, 2);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.pendingTitle}</h2>
            <Link href="/procesos" className="inline-flex items-center gap-1 text-sm text-[#64748b]">
              {investorCopy.goProcesses}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="mt-10 text-center text-sm font-semibold text-[#2b3b4a]">{investorCopy.pendingEmpty}</p>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-[#64748b]">{investorCopy.pendingBody}</p>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.trendsTitle}</h2>
            <Link href="/tendencias" className="inline-flex items-center gap-1 text-sm text-[#64748b]">
              {investorCopy.seeAll}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {news.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-[#e7eaee]">
                <div className="h-28 bg-[#d9e2ea]" />
                <div className="p-3">
                  <p className="text-xs text-[#64748b]">
                    {item.source} · {item.tag}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-5 text-[#2b3b4a]">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.activityTitle}</h2>
          <p className="mt-1 text-sm text-[#64748b]">{investorCopy.activityIntro}</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((label) => (
              <li key={label} className="rounded-2xl border border-[#e7eaee] px-3 py-4">
                <p className="text-2xl font-semibold">0</p>
                <p className="text-xs text-[#17663a]">0%</p>
                <p className="mt-2 text-xs text-[#64748b]">{label}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.opportunities}</h2>
          <p className="mt-1 text-sm text-[#64748b]">{investorCopy.opportunitiesBody}</p>
          <Link href="/mercado" className="mt-4 inline-flex text-sm font-medium text-[#465ab4] underline">
            {investorCopy.goCompanies}
          </Link>
        </section>
      </div>
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.completeProfile}</h2>
          <p className="mt-1 text-sm text-[#64748b]">{investorCopy.completeProfileBody}</p>
          <div className="mx-auto mt-4 flex w-40 flex-col items-center">
            <svg viewBox="0 0 120 72" className="w-full" aria-hidden>
              <path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="#e7eaee" strokeWidth="10" strokeLinecap="round" />
            </svg>
            <p className="-mt-8 text-2xl font-semibold">0%</p>
            <p className="text-xs text-[#64748b]">{investorCopy.completedLabel}</p>
          </div>
          <ul className="mt-4">
            {checklist.map((item) => (
              <li key={item.label} className="border-t border-[#eef0f3]">
                <Link href={item.href} className="flex items-center justify-between gap-3 py-3 text-sm text-[#2b3b4a]">
                  {item.label}
                  <item.icon className="size-4 shrink-0 text-[#64748b]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.notificationsTitle}</h2>
          {notifications.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm font-semibold">{investorCopy.notificationsEmpty}</p>
              <p className="mt-1 text-sm text-[#64748b]">{investorCopy.notificationsEmptyBody}</p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {notifications.slice(0, 4).map((item) => (
                <li key={item.id} className="rounded-xl bg-[#f4f7ff] px-3 py-3">
                  <p className="text-sm font-semibold text-[#2b3b4a]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#64748b]">{item.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
