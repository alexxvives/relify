import Link from "next/link";
import { Briefcase, Check, FileText, Layers, User } from "lucide-react";
import { CompletionMeter } from "@/components/completion-meter";
import { NoticeList } from "@/components/notice-list";
import { SectorTreemap } from "@/components/sector-treemap";
import { OpenNoticeList } from "@/components/notification-bell";
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

const stepTones = [
  "border-[#f3c9c4] bg-[#fdf0ee] text-[#a32d23]",
  "border-[#f0d7a8] bg-[#fff6e8] text-[#9a5b12]",
  "border-[#c9d6f5] bg-[#eef3ff] text-[#465ab4]",
  "border-[#b7e4dc] bg-[#e7f7f4] text-[#0e7c6b]",
  "border-[#c6e6d0] bg-[#eef8f1] text-[#17663a]",
] as const;

function StepCards({
  rows,
}: {
  rows: { label: string; value: number; href: string }[];
}) {
  return (
    <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
      {rows.map((row, index) => (
        <li key={row.label}>
          <Link
            href={row.href}
            className={`flex h-full flex-col rounded-2xl border px-4 py-5 transition duration-300 hover:-translate-y-0.5 ${stepTones[index] ?? stepTones[0]}`}
          >
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{row.value}</span>
            <span className="mt-2 text-sm font-medium">{row.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const checklist = [
  { key: "identity", label: advisorCopy.profileIdentity, href: "/mis-servicios", icon: User },
  { key: "description", label: advisorCopy.profileDescription, href: "/mis-servicios", icon: FileText },
  { key: "sectors", label: advisorCopy.profileSectors, href: "/mis-servicios", icon: Layers },
  { key: "services", label: advisorCopy.profileServices, href: "/mis-servicios", icon: Briefcase },
] as const;

export function AdvisorHome({
  notifications,
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

  return (
    <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
      <div className="flex w-full min-w-0 flex-col gap-6 self-start">
        <PendingActions items={pending} empty={advisorCopy.pendingEmpty} />
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.stepsTitle}</h2>
          <StepCards
            rows={desk.steps
              .map((step) => ({
                label: stepLabel[step.step],
                value: step.count,
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
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.notificationsTitle}</h2>
            <OpenNoticeList label={advisorCopy.seeAll} />
          </div>
          {notifications.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm font-semibold text-[#1c2740]">{advisorCopy.notificationsEmpty}</p>
              <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.notificationsEmptyBody}</p>
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
