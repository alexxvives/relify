import { CountDonut } from "@/components/admin-charts";
import { adminCopy } from "@/lib/admin-copy";
import type { AdminBilling, BillingBook } from "@/server/getAdminBilling";

export function AdminBilling({ billing }: { billing: AdminBilling }) {
  const plans = billing.plans.map((row) => ({
    label: adminCopy.plans[row.plan],
    value: row.count,
  }));
  const planTotal = plans.reduce((sum, row) => sum + row.value, 0);
  const summary = [
    { label: adminCopy.billingCollected, value: billing.collected, hint: adminCopy.billingCollectedHint },
    { label: adminCopy.billingRecorded, value: billing.recorded, hint: adminCopy.billingRecordedHint },
    { label: adminCopy.quotesTitle, value: String(billing.quotes), hint: adminCopy.billingQuotesNote },
  ];

  return (
    <div className="flex flex-col gap-6">
      <p
        className={
          billing.live
            ? "rounded-2xl bg-[#1c2740] px-4 py-3 text-sm text-white"
            : "rounded-2xl bg-[#fff8db] px-4 py-3 text-sm text-[#614d05]"
        }
      >
        {billing.live ? adminCopy.paymentsLive : adminCopy.paymentsTest} {adminCopy.billingNote}
      </p>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#1c2740]">{adminCopy.plansTitle}</h2>
            <p className="text-right">
              <span className="block text-xs text-[#667085]">{adminCopy.totalLabel}</span>
              <span className="text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{planTotal}</span>
            </p>
          </div>
          {planTotal === 0 ? <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p> : <CountDonut rows={plans} palette="red" />}
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#1c2740]">{adminCopy.billingSummary}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {summary.map((item) => (
              <li key={item.label} className="rounded-xl bg-[#f7f8fb] px-4 py-3">
                <p className="text-xs text-[#667085]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{item.value}</p>
                <p className="mt-1 text-sm text-[#3d4a63]">{item.hint}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {billing.books.map((book) => (
          <Book key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

function Book({ book }: { book: BillingBook }) {
  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1c2740]">{book.title}</h2>
          <p className="mt-1 text-sm text-[#667085]">{book.note}</p>
        </div>
        <p className="text-right">
          <span className="block text-xs text-[#667085]">{adminCopy.totalLabel}</span>
          <span className="text-lg font-semibold text-[#1c2740] tabular-nums">{book.total}</span>
        </p>
      </div>
      {book.entries.length === 0 ? (
        <p className="mt-4 text-sm text-[#667085]">{adminCopy.billingNone}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {book.entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#f7f8fb] px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#1c2740]">{entry.title}</p>
                <p className="mt-0.5 text-xs text-[#667085]">{entry.detail}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[#1c2740] tabular-nums">{entry.amount}</p>
            </li>
          ))}
        </ul>
      )}
      {book.count > book.entries.length ? <p className="mt-3 text-xs text-[#667085]">{adminCopy.billingRecent}</p> : null}
    </section>
  );
}
