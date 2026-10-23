import Link from "next/link";
import { ArrowRight, Camera, Check, HandHeart, MapPin, Search, UserRound } from "lucide-react";
import { CompletionMeter } from "@/components/completion-meter";
import { PendingActions } from "@/components/pending-actions";
import { SectorTreemap } from "@/components/sector-treemap";
import { NoticeList } from "@/components/notice-list";
import { investorCopy } from "@/lib/investor-copy";
import type { IndustrySector } from "@/lib/cnae-section";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import type { NotificationView } from "@/lib/notifications";
import type { InvestorProfileChecks } from "@/server/investorDesk";
import { blogPosts, formatBlogDate } from "@/lib/blog";

const checklist = [
  { key: "photo", label: investorCopy.photoItem, href: "/inversor/perfil#foto", icon: Camera },
  { key: "place", label: investorCopy.placeItem, href: "/inversor/perfil#lugar", icon: MapPin },
  { key: "kind", label: investorCopy.kindItem, href: "/inversor/perfil#tipo", icon: UserRound },
  { key: "search", label: investorCopy.searchItem, href: "/inversor/perfil#busqueda", icon: Search },
  { key: "offer", label: investorCopy.offerItem, href: "/inversor/perfil#aporte", icon: HandHeart },
] as const;

export function InvestorHome({
  notifications,
  favorites,
  interests,
  questions,
  meetings,
  profileChecks,
  sectors,
  pending,
}: {
  notifications: NotificationView[];
  favorites: number;
  interests: number;
  questions: number;
  meetings: number;
  profileChecks: InvestorProfileChecks;
  sectors: IndustrySector[];
  pending: HomePendingAction[];
}) {
  const stats = [
    { label: investorCopy.favoritesStat, value: favorites },
    { label: investorCopy.interestsSent, value: interests },
    { label: investorCopy.questionsSent, value: questions },
    { label: investorCopy.meetingsDone, value: meetings },
  ];
  const news = [...blogPosts].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 2);
  const filled = checklist.filter((item) => profileChecks[item.key]).length;
  const profileComplete = filled === checklist.length;

  return (
    <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
      <div className="flex min-w-0 flex-col gap-6">
        <PendingActions items={pending} empty={investorCopy.pendingEmpty} />
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.activityTitle}</h2>
          <p className="mt-1 text-sm text-[#64748b]">{investorCopy.activityIntro}</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((item) => (
              <li key={item.label} className="rounded-2xl border border-[#e7eaee] px-3 py-4">
                <p className="text-2xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs text-[#64748b]">{item.label}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.sectorsTitle}</h2>
          <SectorTreemap sectors={sectors} empty={investorCopy.sectorsEmpty} />
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
              <li key={item.slug} className="overflow-hidden rounded-2xl border border-[#e7eaee]">
                <Link href={`/blog/${item.slug}`} className="block p-3 hover:bg-[#f7f8fb]">
                  <p className="text-xs text-[#64748b]">
                    {item.category} · {formatBlogDate(item.date)}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-5 text-[#2b3b4a]">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">{item.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="relative xl:min-h-full">
        <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className={profileComplete ? "text-2xl font-semibold text-[#17663a]" : "text-2xl font-semibold text-[#2b3b4a]"}>
            {investorCopy.completeProfile}
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">{investorCopy.completeProfileBody}</p>
          <CompletionMeter filled={filled} total={checklist.length} label={investorCopy.completedLabel} display="percent" />
          <ul className="mt-4">
            {checklist.map((item) => {
              const done = profileChecks[item.key];
              return (
                <li key={item.key} className="border-t border-[#eef0f3]">
                  <Link
                    href={item.href}
                    className={
                      done
                        ? "flex items-center justify-between gap-3 py-3 text-sm text-[#17663a]"
                        : "flex items-center justify-between gap-3 py-3 text-sm text-[#2b3b4a]"
                    }
                  >
                    {item.label}
                    {done ? (
                      <Check className="size-4 shrink-0 text-[#17663a]" aria-hidden />
                    ) : (
                      <item.icon className="size-4 shrink-0 text-[#64748b]" aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.notificationsTitle}</h2>
          {notifications.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm font-semibold">{investorCopy.notificationsEmpty}</p>
              <p className="mt-1 text-sm text-[#64748b]">{investorCopy.notificationsEmptyBody}</p>
            </div>
          ) : (
            <NoticeList items={notifications} scroll icons />
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
