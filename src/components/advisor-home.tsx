import Link from "next/link";
import { Briefcase, Check, CircleCheck, FileText, Layers, ShieldCheck, User, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { ActivityTiles, type ActivityTile } from "@/components/activity-tiles";
import { CompletionMeter } from "@/components/completion-meter";
import { SectorTreemap } from "@/components/sector-treemap";
import { PendingActions } from "@/components/pending-actions";
import { advisorCopy } from "@/lib/advisor-copy";
import type { AdvisorHomeDesk, AdvisorStep } from "@/lib/engagement";
import type { NotificationView } from "@/lib/notifications";
import type { AdvisorProfileChecks } from "@/lib/advisor-profile";
import type { IndustrySector } from "@/lib/cnae-section";

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
  { key: "identity", label: advisorCopy.profileIdentity, href: "/mis-servicios", icon: User },
  { key: "description", label: advisorCopy.profileDescription, href: "/mis-servicios", icon: FileText },
  { key: "sectors", label: advisorCopy.profileSectors, href: "/mis-servicios", icon: Layers },
  { key: "services", label: advisorCopy.profileServices, href: "/mis-servicios", icon: Briefcase },
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
    <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
      <div className="flex w-full min-w-0 flex-col gap-6 self-start">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.stepsTitle}</h2>
          <ActivityTiles
            columns="md:grid-cols-3 2xl:grid-cols-5"
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
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.sectorsTitle}</h2>
          <SectorTreemap sectors={sectors} empty={advisorCopy.sectorsEmpty} />
        </section>
      </div>
      <div className="relative w-full xl:min-h-full">
        <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className={profileComplete ? "text-2xl font-semibold text-[#17663a]" : "text-2xl font-semibold text-[#2b3b4a]"}>
            {advisorCopy.profileTitle}
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.profileBody}</p>
          <CompletionMeter filled={filled} total={checklist.length} label={advisorCopy.completedLabel} display="percent" />
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
        <PendingActions side items={pending} empty={advisorCopy.pendingEmpty} />
        </div>
      </div>
    </div>
  );
}
