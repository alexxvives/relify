import Link from "next/link";
import { Camera, Check, HandHeart, MapPin, Search, UserRound } from "lucide-react";
import { BuyerActivitySummary } from "@/components/shell/activity-summary";
import type { InvestorFunnel } from "@/lib/server/activity-funnel";
import type { DealStep } from "@/lib/deal-pipeline";
import { CompletionMeter } from "@/components/seller/completion-meter";
import { PendingActions } from "@/components/shell/pending-actions";
import { SectorTreemap } from "@/components/public/sector-treemap";
import { investorCopy } from "@/lib/investor-copy";
import type { IndustrySector } from "@/lib/cnae-section";
import type { HomePendingAction } from "@/lib/deal-pipeline";
import type { NotificationView } from "@/lib/notifications";
import type { InvestorProfileChecks } from "@/lib/server/investor-desk";
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
  const filled = checklist.filter((item) => profileChecks[item.key]).length;
  const profileComplete = filled === checklist.length;

  return (
    <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex w-full min-w-0 flex-col gap-6 self-start">
        <BuyerActivitySummary funnel={funnel} processes={processes} />
        <Card>
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{investorCopy.sectorsTitle}</h2>
          <SectorTreemap sectors={sectors} empty={investorCopy.sectorsEmpty} />
        </Card>
      </div>
      {/* Alex (S26): a narrower side column; when it stacks (below xl) the two cards sit side by side. */}
      <div className="relative w-full xl:min-h-full">
        <div className="grid items-start gap-6 md:grid-cols-2 xl:absolute xl:inset-0 xl:flex xl:flex-col xl:items-stretch">
        <Card className="p-4">
          <h2 className={profileComplete ? "text-xl font-semibold text-[#17663a]" : "text-xl font-semibold text-[#2b3b4a]"}>
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
                        ? "flex items-center justify-between gap-3 py-2.5 text-sm text-[#17663a]"
                        : "flex items-center justify-between gap-3 py-2.5 text-sm text-[#2b3b4a]"
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
