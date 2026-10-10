import { adminCopy } from "@/lib/admin-copy";
import type { AdminBilling } from "@/server/getAdminBilling";

export function AdminBilling({ billing }: { billing: AdminBilling }) {
  return (
    <div className="flex flex-col gap-6">
      <p
        className={
          billing.live
            ? "rounded-2xl bg-[#1c2740] px-4 py-3 text-sm text-white"
            : "rounded-2xl bg-[#fff8db] px-4 py-3 text-sm text-[#614d05]"
        }
      >
        {billing.live ? adminCopy.paymentsLive : adminCopy.paymentsTest}
      </p>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1c2740]">{adminCopy.plansTitle}</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {billing.plans.map((row) => (
            <li key={row.plan} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[#3d4a63]">{adminCopy.plans[row.plan]}</span>
              <span className="text-lg font-semibold text-[#1c2740] tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1c2740]">{adminCopy.quotesTitle}</h2>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{billing.quotes}</p>
      </section>
      <p className="text-sm text-[#667085]">{adminCopy.billingNote}</p>
    </div>
  );
}
