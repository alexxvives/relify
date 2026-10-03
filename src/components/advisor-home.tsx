import Link from "next/link";
import { ArrowRight, Crown, Package } from "lucide-react";
import { advisorCopy } from "@/lib/advisor-copy";
import type { NotificationView } from "@/lib/notifications";
import { trendItems } from "@/lib/seller-copy";

const counters = [
  advisorCopy.pendingActions,
  advisorCopy.activeProcesses,
  advisorCopy.savedSearches,
] as const;

const metrics = [advisorCopy.interestsManaged, advisorCopy.questions, advisorCopy.meetings] as const;

export function AdvisorHome({
  notifications,
  profileReady,
}: {
  notifications: NotificationView[];
  profileReady: boolean;
}) {
  const news = trendItems.filter((item) => item.kind === "news").slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#e7eaee] bg-white px-5 py-10">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.mandatesTitle}</h2>
        <div className="mx-auto mt-8 flex max-w-md flex-col items-center text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f4f4f5] text-[#64748b]">
            <Package className="size-5" aria-hidden />
          </span>
          <h3 className="mt-4 text-base font-semibold text-[#2b3b4a]">{advisorCopy.mandatesEmpty}</h3>
          <p className="mt-2 text-sm text-[#64748b]">{advisorCopy.mandatesEmptyBody}</p>
          <button
            type="button"
            className="mt-5 inline-flex h-11 items-center rounded-full bg-[#3d34b8] px-5 text-sm font-medium text-white"
          >
            {advisorCopy.addMandate}
          </button>
        </div>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{advisorCopy.investorProfile}</h2>
            <Link
              href="/cuenta"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#ffaf4d] px-4 text-sm font-medium text-[#2b3b4a]"
            >
              <Crown className="size-4" aria-hidden />
              {advisorCopy.choosePremium}
            </Link>
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
            <ul className="mt-4 flex flex-col gap-3">
              {notifications.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <p className="text-sm font-medium text-[#2b3b4a]">{item.title}</p>
                  <p className="text-sm text-[#64748b]">{item.body}</p>
                </li>
              ))}
            </ul>
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
            <li key={item.id} className="rounded-2xl border border-[#e7eaee] p-4">
              <p className="text-xs text-[#64748b]">
                {item.source} · {item.tag}
              </p>
              <p className="mt-2 text-sm font-medium leading-5 text-[#2b3b4a]">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">{item.body}</p>
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
