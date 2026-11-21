import Link from "next/link";
import { Briefcase, Check, CircleCheck, CreditCard, FileText, Layers, ShieldCheck, User, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { ActivityTiles, type ActivityTile } from "@/components/shell/activity-tiles";
import { CompletionMeter } from "@/components/seller/completion-meter";
import { SectorTreemap } from "@/components/public/sector-treemap";
import { PendingActions } from "@/components/shell/pending-actions";
import { advisorCopy } from "@/lib/advisor-copy";
import type { AdvisorHomeDesk, AdvisorStep } from "@/lib/engagement";
import type { NotificationView } from "@/lib/notifications";
import type { AdvisorProfileChecks } from "@/lib/advisor-profile";
import type { IndustrySector } from "@/lib/cnae-section";
import { Card } from "@/components/ui/form";
import { AdvisorSubscribeRow } from "@/components/advisor/advisor-subscribe-button";

const stepLabel: Record<AdvisorStep, string> = {
  request: advisorCopy.stepRequest,
  deposit: advisorCopy.stepDeposit,
  nda: advisorCopy.stepNda,
  active: advisorCopy.stepActive,
  closed: advisorCopy.stepClosed,
};

const stepLook: Record<AdvisorStep, { icon: LucideIcon; tone: ActivityTile["tone"] }> = {
  request: { icon: UserPlus, tone: "sky" },
  deposit: { icon: Wallet, tone: "amber" },
  nda: { icon: ShieldCheck, tone: "emerald" },
  active: { icon: Briefcase, tone: "indigo" },
  closed: { icon: CircleCheck, tone: "orange" },
};

const checklist = [
  { key: "identity", label: advisorCopy.profileIdentity, href: "/mis-servicios?ancla=datos-corporativos", icon: User },
  { key: "description", label: advisorCopy.profileDescription, href: "/mis-servicios?ancla=advisor-description", icon: FileText },
  { key: "sectors", label: advisorCopy.profileSectors, href: "/mis-servicios?ancla=advisor-sectors", icon: Layers },
  { key: "services", label: advisorCopy.profileServices, href: "/mis-servicios?ancla=advisor-services", icon: Briefcase },
  { key: "subscription", label: advisorCopy.profileSubscription, href: "/inicio", icon: CreditCard },
] as const;

export function AdvisorHome({
  desk,
  profileChecks,
  sectors,
}: {
  notifications: NotificationView[];
  desk: AdvisorHomeDesk;
  profileChecks: AdvisorProfileChecks;
  sectors: IndustrySector[];
}) {
  const pending = desk.pending.map((item) => ({
    id: item.id,
    title: item.kind === "deposit" ? advisorCopy.payDeposit : advisorCopy.signNda,
    detail: item.codename,
    href: item.href,
  }));
  const filled = checklist.filter((item) => profileChecks[item.key]).length;
  const profileComplete = filled === checklist.length;
  const totalEngagements = desk.steps.reduce((sum, step) => sum + step.count, 0);

  return (
    <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex w-full min-w-0 flex-col gap-6 self-start">
        <Card>
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.stepsTitle}</h2>
          <ActivityTiles
            tiles={desk.steps.map((step) => ({
              label: stepLabel[step.step],
              value: step.count,
              icon: stepLook[step.step].icon,
              tone: stepLook[step.step].tone,
              ratio: totalEngagements > 0 ? step.count / totalEngagements : 0,
              caption: `${step.count} de ${totalEngagements} encargos`,
              href: step.href,
            }))}
          />
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.sectorsTitle}</h2>
          <SectorTreemap sectors={sectors} empty={advisorCopy.sectorsEmpty} />
        </Card>
      </div>
      <div className="relative w-full xl:min-h-full">
        <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
        {/* S35 (Alex): same card as the seller's Inicio: published / not published, no subtitle, Obligatorio tags. */}
        <Card className="p-4">
          <h2 className={profileComplete ? "text-xl font-semibold text-[#17663a]" : "text-lg font-semibold text-[#c0362c]"} data-advisor-publish>
            {profileComplete ? advisorCopy.profilePublished : advisorCopy.profileUnpublished}
          </h2>
          <CompletionMeter filled={filled} total={checklist.length} label={advisorCopy.completedLabel} display="percent" />
          <ul className="mt-4 overflow-hidden rounded-xl border border-[#e6eaf5] bg-white">
            {checklist.map((item) => {
              const done = profileChecks[item.key];
              const row = (
                <>
                  <item.icon className={`size-4 shrink-0 ${done ? "text-[#17663a]" : "text-[#64748b]"}`} aria-hidden />
                  <span className={`min-w-0 flex-1 ${done ? "text-[#667085]" : "font-medium text-[#1c2740]"}`}>{item.label}</span>
                  {done ? (
                    <Check className="size-4 shrink-0 text-[#17663a]" aria-label="Hecho" />
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-[#a12f2f]">
                      {advisorCopy.requiredTag}
                    </span>
                  )}
                </>
              );
              return (
                <li key={item.key} className="border-t border-[#e6eaf5] first:border-t-0">
                  {done ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 text-sm">{row}</div>
                  ) : item.key === "subscription" ? (
                    <AdvisorSubscribeRow>{row}</AdvisorSubscribeRow>
                  ) : (
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-[#f7f8fb]">
                      {row}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
        <PendingActions side items={pending} empty={advisorCopy.pendingEmpty} />
        </div>
      </div>
    </div>
  );
}
