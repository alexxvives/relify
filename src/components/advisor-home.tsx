import Link from "next/link";
import { CountBars } from "@/components/admin-charts";
import { NoticeList } from "@/components/notice-list";
import { OpenNoticeList } from "@/components/notification-bell";
import { PendingActions } from "@/components/pending-actions";
import { advisorCopy } from "@/lib/advisor-copy";
import type { AdvisorHomeDesk, AdvisorStep } from "@/lib/engagement";
import type { NotificationView } from "@/lib/notifications";

const stepLabel: Record<AdvisorStep, { label: string; color: string }> = {
  request: { label: advisorCopy.stepRequest, color: "#c5cce0" },
  deposit: { label: advisorCopy.stepDeposit, color: "#465ab4" },
  nda: { label: advisorCopy.stepNda, color: "#1c2740" },
  active: { label: advisorCopy.stepActive, color: "#7c8ec4" },
  closed: { label: advisorCopy.stepClosed, color: "#17663a" },
};

export function AdvisorHome({
  notifications,
  desk,
}: {
  notifications: NotificationView[];
  desk: AdvisorHomeDesk;
}) {
  const stats = [
    { label: advisorCopy.openEngagements, value: desk.open.count, href: desk.open.href },
    { label: advisorCopy.inboxStat, value: desk.inbox.count, href: desk.inbox.href },
    { label: advisorCopy.pendingDeposits, value: desk.deposits.count, href: desk.deposits.href },
    { label: advisorCopy.pendingNdas, value: desk.ndas.count, href: desk.ndas.href },
  ];
  const pending = desk.pending.map((item) => ({
    id: item.id,
    title: item.kind === "deposit" ? advisorCopy.payDeposit : advisorCopy.signNda,
    detail: item.codename,
    href: item.href,
  }));

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <PendingActions items={pending} empty={advisorCopy.pendingEmpty} />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="block rounded-2xl border border-[#e7eaee] bg-white px-4 py-4 hover:border-[#465ab4]">
                <p className="text-xs text-[#667085]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{item.value}</p>
              </Link>
            </li>
          ))}
        </ul>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#1c2740]">{advisorCopy.stepsTitle}</h2>
          <CountBars
            stacked
            rows={desk.steps.map((step) => ({
              label: stepLabel[step.step].label,
              value: step.count,
              href: step.href,
              color: stepLabel[step.step].color,
            }))}
          />
        </section>
      </div>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-[#1c2740]">{advisorCopy.notificationsTitle}</h2>
          <OpenNoticeList label={advisorCopy.seeAll} />
        </div>
        {notifications.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="text-sm font-semibold text-[#1c2740]">{advisorCopy.notificationsEmpty}</p>
            <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.notificationsEmptyBody}</p>
          </div>
        ) : (
          <NoticeList items={notifications} limit={3} />
        )}
      </section>
    </div>
  );
}
