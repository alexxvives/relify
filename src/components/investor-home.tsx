import Link from "next/link";
import { ArrowRight, Camera, Check, HandHeart, MapPin, Search, UserRound } from "lucide-react";
import { BuyerActivitySummary } from "@/components/activity-summary";
import type { InvestorFunnel } from "@/server/activityFunnel";
import type { DealStep } from "@/lib/deal-pipeline";
import { CompletionMeter } from "@/components/completion-meter";
import { PendingActions } from "@/components/pending-actions";
import { SectorTreemap } from "@/components/sector-treemap";
import { investorCopy } from "@/lib/investor-copy";
import type { IndustrySector } from "@/lib/cnae-section";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import type { NotificationView } from "@/lib/notifications";
import type { InvestorProfileChecks } from "@/server/investorDesk";
import { blogPosts, formatBlogDate } from "@/lib/blog";
import { Card } from "@/components/ui/form";

const checklist = [
  { key: "photo", label: investorCopy.photoItem, href: "/inversor/perfil#foto", icon: Camera },
  { key: "place", label: investorCopy.placeItem, href: "/inversor/perfil#lugar", icon: MapPin },
  { key: "kind", label: investorCopy.kindItem, href: "/inversor/perfil#tipo", icon: UserRound },
  { key: "search", label: investorCopy.searchItem, href: "/inversor/perfil#busqueda", icon: Search },
  { key: "offer", label: investorCopy.offerItem, href: "/inversor/perfil#aporte", icon: HandHeart },
] as const;

export function InvestorHome({
  funnel,
  processes,
  profileChecks,
  sectors,
  pending,
}: {
  notifications: NotificationView[];
  funnel: InvestorFunnel;
  processes: { closed: unknown; steps: DealStep[] }[];
  profileChecks: InvestorProfileChecks;
  sectors: IndustrySector[];
  pending: HomePendingAction[];
}) {
  const news = [...blogPosts].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 2);
  const filled = checklist.filter((item) => profileChecks[item.key]).length;
  const profileComplete = filled === checklist.length;

  return (
    <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
      <div className="flex w-full min-w-0 flex-col gap-6 self-start">
        <BuyerActivitySummary funnel={funnel} processes={processes} />
        <Card>
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.sectorsTitle}</h2>
          <SectorTreemap sectors={sectors} empty={investorCopy.sectorsEmpty} />
        </Card>
        <Card>
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
        </Card>
      </div>
      <div className="relative w-full xl:min-h-full">
        <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
        <Card>
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
        </Card>
        <PendingActions side items={pending} empty={investorCopy.pendingEmpty} />
        </div>
      </div>
    </div>
  );
}
