import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdvisorMandateBoard, type MandateDisplay } from "@/components/advisor-mandates";
import { NoticeList } from "@/components/notice-list";
import { advisorCopy } from "@/lib/advisor-copy";
import { catalogCopy } from "@/lib/catalog-copy";
import { formatEur } from "@/lib/money";
import type { NotificationView } from "@/lib/notifications";
import type { PendingMatch } from "@/lib/billing";
import type { MandateCard } from "@/server/listSaleMandates";
import { blogPosts, formatBlogDate } from "@/lib/blog";

function toMandateDisplay(project: MandateCard): MandateDisplay {
  return {
    slug: project.slug,
    codename: project.codename,
    region: project.region,
    status: project.status,
    feeRecorded: project.feeRecorded,
    owned: project.owned,
    figures: catalogCopy.metrics.map((metric) => ({
      label: metric.label,
      value: formatEur(project[metric.key]),
    })),
  };
}

const counters = [
  advisorCopy.pendingActions,
  advisorCopy.activeProcesses,
  advisorCopy.savedSearches,
] as const;

const metrics = [advisorCopy.interestsManaged, advisorCopy.questions, advisorCopy.meetings] as const;

export function AdvisorHome({
  notifications,
  profileReady,
  mandates,
  pending,
}: {
  notifications: NotificationView[];
  profileReady: boolean;
  mandates: MandateCard[];
  pending: PendingMatch[];
}) {
  const news = [...blogPosts].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#e7eaee] bg-white px-5 py-10">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.mandatesTitle}</h2>
        <AdvisorMandateBoard mandates={mandates.map(toMandateDisplay)} pending={pending} />
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.investorProfile}</h2>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {counters.map((label) => (
              <li key={label} className="rounded-2xl bg-[#f7f8fb] px-4 py-5">
                <p className="text-2xl font-semibold">0</p>
                <p className="mt-1 text-sm text-[#64748b]">{label}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.notificationsTitle}</h2>
          {notifications.length === 0 ? (
            <div className="mt-8 text-center">
              <h3 className="text-sm font-semibold text-[#2b3b4a]">{advisorCopy.notificationsEmpty}</h3>
              <p className="mt-2 text-sm text-[#64748b]">{advisorCopy.notificationsEmptyBody}</p>
            </div>
          ) : (
            <NoticeList items={notifications} />
          )}
        </section>
      </div>
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
            <li key={item.slug} className="rounded-2xl border border-[#e7eaee]">
              <Link href={`/blog/${item.slug}`} className="block p-4 hover:bg-[#f7f8fb]">
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
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.metricsTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.metricsIntro}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {metrics.map((label) => (
            <li key={label} className="rounded-2xl border border-[#e7eaee] px-4 py-5">
              <p className="text-2xl font-semibold">0</p>
              <p className="mt-2 text-sm text-[#64748b]">{label}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.servicesTeaserTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{advisorCopy.servicesTeaserBody}</p>
        <Link href="/mis-servicios" className="mt-4 block rounded-2xl bg-[#f7f8fb] p-4">
          <span className="block text-base font-semibold text-[#2b3b4a]">
            {profileReady ? advisorCopy.goServices : advisorCopy.activateProfile}
          </span>
          {profileReady ? null : (
            <span className="mt-1 block text-sm text-[#64748b]">{advisorCopy.activateProfileBody}</span>
          )}
        </Link>
      </section>
    </div>
  );
}
