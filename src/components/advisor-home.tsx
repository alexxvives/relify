import Link from "next/link";
import { ArrowRight, Briefcase, Check, FileText, Layers, User } from "lucide-react";
import { CompletionMeter } from "@/components/completion-meter";
import { NoticeList } from "@/components/notice-list";
import { OpenNoticeList } from "@/components/notification-bell";
import { PendingActions } from "@/components/pending-actions";
import { advisorCopy } from "@/lib/advisor-copy";
import { blogPosts, formatBlogDate } from "@/lib/blog";
import type { AdvisorHomeDesk, AdvisorStep } from "@/lib/engagement";
import type { NotificationView } from "@/lib/notifications";
import type { AdvisorProfileChecks } from "@/lib/advisor-profile";

const stepLabel: Record<AdvisorStep, string> = {
  request: advisorCopy.stepRequest,
  deposit: advisorCopy.stepDeposit,
  nda: advisorCopy.stepNda,
  active: advisorCopy.stepActive,
  closed: advisorCopy.stepClosed,
};

function StepCards({
  rows,
}: {
  rows: { label: string; value: number; href: string }[];
}) {
  return (
    <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rows.map((row) => (
        <li key={row.label}>
          <Link
            href={row.href}
            className="flex h-full flex-col rounded-2xl border border-[#eef0f3] bg-[#f7f8fb] px-4 py-4 hover:border-[#465ab4]"
          >
            <span className="text-3xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{row.value}</span>
            <span className="mt-2 text-sm text-[#3d4a63]">{row.label}</span>
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
}: {
  notifications: NotificationView[];
  desk: AdvisorHomeDesk;
  profileChecks: AdvisorProfileChecks;
}) {
  const stats = [
    { label: advisorCopy.openEngagements, value: desk.open.count, href: desk.open.href },
    { label: advisorCopy.pendingDeposits, value: desk.deposits.count, href: desk.deposits.href },
    { label: advisorCopy.pendingNdas, value: desk.ndas.count, href: desk.ndas.href },
  ];
  const pending = desk.pending.map((item) => ({
    id: item.id,
    title: item.kind === "deposit" ? advisorCopy.payDeposit : advisorCopy.signNda,
    detail: item.codename,
    href: item.href,
  }));
  const news = [...blogPosts].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 2);
  const filled = checklist.filter((item) => profileChecks[item.key]).length;
  const profileComplete = filled === checklist.length;

  return (
    <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
      <div className="flex min-w-0 flex-col gap-6">
        <PendingActions items={pending} empty={advisorCopy.pendingEmpty} />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="block h-full rounded-2xl border border-[#e7eaee] bg-white px-4 py-4 hover:border-[#465ab4]">
                <p className="text-xs text-[#667085]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{item.value}</p>
              </Link>
            </li>
          ))}
        </ul>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.stepsTitle}</h2>
          <StepCards
            rows={desk.steps
              .filter((step) => step.step !== "request")
              .map((step) => ({
                label: stepLabel[step.step],
                value: step.count,
                href: step.href,
              }))}
          />
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.trendsTitle}</h2>
            <Link href="/tendencias" className="inline-flex items-center gap-1 text-sm text-[#64748b]">
              {advisorCopy.seeAll}
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
      <div className="flex h-full flex-col gap-6">
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
            <NoticeList items={notifications} scroll />
          )}
        </section>
      </div>
    </div>
  );
}
