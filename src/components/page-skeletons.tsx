import type { ReactNode } from "react";

/*
 * Content-only loading states. Each one mirrors the grid, cards and heights of
 * the page it stands in for; the sidebar and page title stay real.
 */

function B({ className }: { className: string }) {
  return <div aria-hidden className={`animate-pulse bg-[#e9edf2] motion-reduce:animate-none ${className.includes("rounded") ? "" : "rounded-lg "}${className}`} />;
}

/** Bone that sits straight on the grey page background, so it needs more contrast. */
function Bare({ className }: { className: string }) {
  return <div aria-hidden className={`animate-pulse bg-[#d5dce5] motion-reduce:animate-none ${className.includes("rounded") ? "" : "rounded-lg "}${className}`} />;
}

function Card({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#e7eaee] bg-white p-5 ${className}`}>{children}</div>;
}

function Shell({ children, label = "Cargando" }: { children: ReactNode; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex min-w-0 flex-col gap-6">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function CardTitle({ width = "w-56", sub = false }: { width?: string; sub?: boolean }) {
  return (
    <div>
      <B className={`h-8 ${width}`} />
      {sub ? <B className="mt-2 h-4 w-72 max-w-full" /> : null}
    </div>
  );
}

function Stats({ count, cols }: { count: number; cols: string }) {
  return (
    <div className={`mt-4 grid gap-3 ${cols}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border border-[#e7eaee] px-3 py-4">
          <B className="h-7 w-10" />
          <B className="mt-3 h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}

function Rows({ count, height = "h-11" }: { count: number; height?: string }) {
  return (
    <div className="mt-4 flex flex-col divide-y divide-[#eef0f3] overflow-hidden rounded-xl border border-[#e7eaee]">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`flex items-center justify-between px-3 ${height}`}>
          <B className="h-3.5 w-40" />
          <B className="size-4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SideColumn({ notes = 3 }: { notes?: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Card>
        <CardTitle width="w-48" sub />
        <div className="mt-5 flex flex-col items-center">
          <B className="h-24 w-44 rounded-t-full" />
          <B className="mt-3 h-3 w-20" />
        </div>
        <Rows count={6} />
      </Card>
      <Card>
        <CardTitle width="w-40" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: notes }, (_, index) => (
            <div key={index} className="flex gap-3 rounded-xl border border-[#eef0f3] p-3">
              <B className="size-8 shrink-0 rounded-full" />
              <div className="flex-1">
                <B className="h-4 w-2/3" />
                <B className="mt-2 h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Treemap() {
  return (
    <Card>
      <CardTitle width="w-48" />
      <div className="mt-4 grid h-[320px] grid-cols-[2fr_1fr] gap-2">
        <B className="h-full rounded-xl" />
        <div className="grid grid-rows-[2fr_1fr] gap-2">
          <B className="h-full rounded-xl" />
          <B className="h-full rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

function Pending() {
  return (
    <Card>
      <CardTitle width="w-60" />
      <B className="mt-3 h-4 w-72 max-w-full" />
    </Card>
  );
}

function HomeGrid({ children, notes }: { children: ReactNode; notes?: number }) {
  return (
    <Shell>
      <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
        <SideColumn notes={notes} />
      </div>
    </Shell>
  );
}

export function InvestorHomeSkeleton() {
  return (
    <HomeGrid>
      <Pending />
      <Card>
        <CardTitle width="w-64" sub />
        <Stats count={4} cols="grid-cols-2 lg:grid-cols-4" />
      </Card>
      <Treemap />
    </HomeGrid>
  );
}

export function SellerHomeSkeleton() {
  return (
    <HomeGrid>
      <Pending />
      <Card>
        <CardTitle width="w-72" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index}>
              <B className="h-4 w-28" />
              <B className="mt-3 h-40 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-2xl border border-[#e7eaee] p-4">
              <B className="h-4 w-20" />
              <B className="mx-auto mt-4 size-24 rounded-full" />
              <B className="mt-4 h-3 w-24" />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle width="w-64" />
        <Stats count={3} cols="grid-cols-3" />
      </Card>
    </HomeGrid>
  );
}

export function AdvisorHomeSkeleton() {
  return (
    <HomeGrid notes={1}>
      <Pending />
      <Card>
        <CardTitle width="w-52" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="rounded-2xl border border-[#e7eaee] px-3 py-4">
              <B className="h-7 w-8" />
              <B className="mt-3 h-3.5 w-20" />
            </div>
          ))}
        </div>
      </Card>
      <Treemap />
    </HomeGrid>
  );
}

function Donut() {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <B className="h-7 w-44" />
        <B className="h-8 w-10" />
      </div>
      <div className="mt-4 flex items-center gap-8">
        <B className="size-32 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-3">
          {[0, 1, 2, 3].map((index) => (
            <B key={index} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function AdminHomeSkeleton() {
  return (
    <Shell>
      <Card>
        <CardTitle width="w-32" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <B key={index} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <Donut key={index} />
        ))}
      </div>
    </Shell>
  );
}

function Field() {
  return (
    <div>
      <B className="h-3 w-16" />
      <B className="mt-2 h-10 w-full rounded-xl" />
    </div>
  );
}

function MarketCardBone() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
      <B className="aspect-[7/4] w-full rounded-none" />
      <div className="p-5">
        <div className="overflow-hidden rounded-xl border border-[#e7eaee]">
          <div className="flex flex-col items-center gap-2 bg-[#f4f6fb] px-4 py-4">
            <B className="h-3 w-24" />
            <B className="h-8 w-40" />
          </div>
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center justify-between border-t border-[#e7eaee] px-4 py-3">
              <B className="h-3.5 w-24" />
              <B className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MarketSkeleton({ heading = true, cards = 6 }: { heading?: boolean; cards?: number }) {
  return (
    <Shell>
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {heading ? <Bare className="h-9 w-40" /> : <span />}
        <Bare className="h-7 w-32 justify-self-center rounded-full" />
      </div>
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.8fr))] lg:items-end">
          {[0, 1, 2, 3, 4].map((index) => (
            <Field key={index} />
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3 min-[2100px]:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <MarketCardBone key={index} />
        ))}
      </div>
    </Shell>
  );
}

function Tabs({ count = 2 }: { count?: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Bare key={index} className="h-8 w-28 rounded-full" />
      ))}
    </div>
  );
}

function Stepper() {
  return (
    <div className="mt-6 flex items-center justify-between gap-2 px-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <B className="size-5 rounded-full" />
          <B className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ProcessesSkeleton() {
  return (
    <Shell>
      <Tabs />
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <B className="h-6 w-40" />
            <B className="mt-2 h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <B className="h-9 w-32 rounded-full" />
            <B className="h-9 w-24 rounded-full" />
          </div>
        </div>
        <Stepper />
        <div className="mt-6">
          <Tabs count={3} />
        </div>
        <div className="mt-4 grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <B className="h-[360px] w-full rounded-2xl" />
          <div className="flex flex-col gap-4">
            <B className="h-40 w-full rounded-2xl" />
            <B className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </Card>
    </Shell>
  );
}

export function AdvisorBoardsSkeleton() {
  return (
    <Shell>
      <Bare className="h-4 w-80 max-w-full" />
      {[0, 1].map((index) => (
        <Card key={index}>
          <div className="flex items-start justify-between">
            <B className="h-6 w-48" />
            <B className="h-9 w-28 rounded-full" />
          </div>
          <Stepper />
        </Card>
      ))}
    </Shell>
  );
}

export function AdvisorySkeleton() {
  return (
    <Shell>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-6">
        <B className="h-4 w-20" />
        <div className="mt-3 rounded-2xl border border-[#e7eaee] bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-4 lg:items-end">
            {[0, 1, 2, 3].map((index) => (
              <Field key={index} />
            ))}
          </div>
        </div>
        <div className="mt-5 grid justify-start gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,32rem),36rem))]">
          {[0, 1].map((index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
              <B className="h-36 w-full rounded-none" />
              <div className="flex flex-col gap-4 p-5">
                <B className="h-4 w-full" />
                <B className="h-4 w-full" />
                <B className="h-9 w-36 self-end rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function FormCard({ fields = 6, title = true }: { fields?: number; title?: boolean }) {
  return (
    <Card>
      {title ? (
        <div className="flex items-start justify-between">
          <CardTitle width="w-60" sub />
          <B className="h-7 w-28 rounded-full" />
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {Array.from({ length: fields }, (_, index) => (
          <Field key={index} />
        ))}
      </div>
    </Card>
  );
}

export function AccountSkeleton() {
  return (
    <Shell>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex gap-5">
          <B className="size-28 shrink-0 rounded-2xl" />
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Field key={index} />
            ))}
          </div>
        </Card>
        <Card>
          <B className="h-4 w-40" />
          <B className="mt-3 h-3 w-full" />
          <B className="mt-2 h-3 w-2/3" />
          <B className="mt-6 h-9 w-full rounded-full" />
        </Card>
      </div>
      <FormCard fields={8} />
    </Shell>
  );
}

export function ProjectSkeleton() {
  return (
    <Shell>
      <Bare className="h-4 w-36" />
      <Bare className="h-[220px] w-full rounded-2xl" />
      <Tabs count={3} />
      <Card>
        <B className="h-6 w-48" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex gap-3">
              <B className="size-9 shrink-0 rounded-xl" />
              <div className="flex-1">
                <B className="h-3 w-20" />
                <B className="mt-2 h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
        <B className="mt-6 h-4 w-40" />
        <B className="mt-3 h-4 w-full" />
      </Card>
      <Card>
        <B className="h-6 w-56" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <B className="h-16 w-full rounded-xl" />
          <B className="h-16 w-full rounded-xl" />
        </div>
      </Card>
    </Shell>
  );
}

export function CompanyDetailsSkeleton() {
  return (
    <Shell>
      <div className="flex items-center justify-between gap-3">
        <Bare className="h-9 w-48" />
        <div className="flex gap-2">
          <Bare className="h-9 w-40 rounded-full" />
          <Bare className="h-9 w-32 rounded-full" />
        </div>
      </div>
      <Tabs />
      <Card>
        <div className="flex items-start justify-between">
          <B className="h-7 w-48" />
          <B className="h-7 w-28 rounded-full" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Field key={index} />
          ))}
        </div>
        <B className="mt-5 h-28 w-full rounded-xl" />
      </Card>
      <Card>
        <div className="flex items-start justify-between">
          <B className="h-7 w-72" />
          <B className="h-7 w-28 rounded-full" />
        </div>
      </Card>
    </Shell>
  );
}

export function DocumentsSkeleton() {
  return (
    <Shell>
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <div className="flex justify-end">
          <B className="h-4 w-36" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-[#eef0f3] bg-[#fbfbfc] px-3"
            >
              <B className="h-12 w-16 rounded-xl" />
              <B className="h-4 w-24" />
              <B className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function AdvisorServicesSkeleton() {
  return (
    <Shell>
      <Card>
        <div className="flex items-start justify-between">
          <CardTitle width="w-52" sub />
          <B className="h-7 w-28 rounded-full" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex gap-3">
              <B className="size-8 shrink-0 rounded-lg" />
              <div className="flex-1">
                <B className="h-3 w-24" />
                <B className="mt-2 h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <Card>
          <CardTitle width="w-72" sub />
          <div className="mt-5 flex flex-col gap-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <B className="size-4 rounded" />
                <B className="h-4 w-40" />
                <B className="ml-auto h-9 w-28 rounded-xl" />
                <B className="h-9 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <B className="h-7 w-52" />
          <B className="mt-4 h-44 w-full rounded-2xl" />
          <B className="mt-4 h-4 w-full" />
          <B className="mt-2 h-4 w-2/3" />
        </Card>
      </div>
      <Card>
        <B className="h-7 w-64" />
      </Card>
    </Shell>
  );
}

function AdminToolbar({ title = "w-40", controls = 2 }: { title?: string; controls?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <Bare className={`h-9 ${title}`} />
        <Bare className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: controls }, (_, index) => (
          <Bare key={index} className={`h-10 rounded-xl ${index === 0 && controls > 1 ? "w-56" : "w-36"}`} />
        ))}
      </div>
    </div>
  );
}

export function AdminListSkeleton({ kind }: { kind: "advisors" | "accounts" | "companies" | "connections" }) {
  if (kind === "accounts") {
    return (
      <Shell>
        <AdminToolbar title="w-32" controls={3} />
        <div className="grid gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid items-start gap-4 rounded-2xl border border-[#e7eaee] bg-white p-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <B className="size-9 shrink-0 rounded-full" />
                <div className="flex-1">
                  <B className="h-4 w-48" />
                  <B className="mt-2 h-3 w-56" />
                  <B className="mt-2 h-4 w-28 rounded-full" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <B className="h-9 w-24 rounded-full" />
                <B className="h-9 w-28 rounded-xl" />
                <B className="h-9 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (kind === "companies") {
    // Mirrors AdminCompanies: header (title + search + status), sort chips, then marketplace cards with admin actions.
    return (
      <Shell>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Bare className="h-9 w-36" />
          <div className="flex gap-2">
            <Bare className="h-10 w-52 rounded-full" />
            <Bare className="h-10 w-44 rounded-full" />
          </div>
        </div>
        <div className="-mt-3 flex flex-wrap items-center gap-2">
          <Bare className="h-4 w-14" />
          {[0, 1, 2, 3, 4].map((chip) => (
            <Bare key={chip} className="h-7 w-24 rounded-full" />
          ))}
        </div>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="flex flex-col gap-3 p-2">
              <div className="overflow-hidden rounded-2xl bg-white">
                <B className="h-[6.75rem] w-full rounded-none" />
                <div className="relative px-3.5 pb-4">
                  <B className="-mt-7 size-16 rounded-2xl border-4 border-white" />
                  <div className="mt-3 flex flex-col gap-2">
                    <B className="h-3 w-full" />
                    <B className="h-3 w-4/5" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#e7eaee]">
                    {[0, 1, 2, 3].map((cell) => (
                      <div key={cell} className="flex flex-col items-center gap-2 py-3">
                        <B className="h-3 w-16" />
                        <B className="h-4 w-14" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Bare className="mx-1 h-3 w-40" />
              <div className="flex justify-end gap-2 px-1">
                <Bare className="h-9 w-28 rounded-full" />
                <Bare className="h-9 w-32 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      </Shell>
    );
  }

  if (kind === "connections") {
    return (
      <Shell>
        <AdminToolbar controls={1} />
        <Card>
          <div className="flex items-start justify-between">
            <B className="h-6 w-64" />
            <B className="h-9 w-24 rounded-full" />
          </div>
          <Stepper />
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <AdminToolbar />
      {[0, 1].map((index) => (
        <Card key={index} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <B className="h-6 w-72" />
            <B className="mt-2 h-3 w-48" />
            <div className="mt-3 flex gap-2">
              <B className="h-6 w-24 rounded-full" />
              <B className="h-6 w-40 rounded-full" />
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[28rem]">
            {[0, 1, 2, 3].map((cell) => (
              <B key={cell} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      ))}
    </Shell>
  );
}

export function AdminBillingSkeleton() {
  return (
    <Shell>
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <B className="h-6 w-40" />
              <B className="h-6 w-20" />
            </div>
            {index === 0 ? <B className="mt-4 h-40 w-full rounded-xl" /> : <B className="mt-4 h-4 w-48" />}
          </Card>
        ))}
      </div>
    </Shell>
  );
}
