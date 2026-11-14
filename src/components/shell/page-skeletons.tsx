import type { ReactNode } from "react";

/*
 * Content-only loading states. Each one mirrors the grid, cards and heights of
 * the page it stands in for; the sidebar and page title stay real.
 */

function B({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse bg-[#e9edf2] motion-reduce:animate-none ${className.includes("rounded") ? "" : "rounded-lg "}${className}`}
    />
  );
}

/** Bone that sits straight on the grey page background, so it needs more contrast. */
function Bare({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse bg-[#d5dce5] motion-reduce:animate-none ${className.includes("rounded") ? "" : "rounded-lg "}${className}`}
    />
  );
}

function Card({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#e7eaee] bg-white p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function Shell({
  children,
  label = "Cargando",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-w-0 flex-col gap-6"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function CardTitle({
  width = "w-56",
  sub = false,
}: {
  width?: string;
  sub?: boolean;
}) {
  return (
    <div>
      <B className={`h-8 ${width}`} />
      {sub ? <B className="mt-2 h-4 w-72 max-w-full" /> : null}
    </div>
  );
}


function Rows({ count, height = "h-11" }: { count: number; height?: string }) {
  return (
    <div className="mt-4 flex flex-col divide-y divide-[#eef0f3] overflow-hidden rounded-xl border border-[#e7eaee]">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`flex items-center justify-between px-3 ${height}`}
        >
          <B className="h-3.5 w-40" />
          <B className="size-4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Right column of the role homes: profile/publish card (gauge + checklist), then "Acciones pendientes". */
function SideColumn({
  rows = 6,
  intro = false,
}: {
  rows?: number;
  intro?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Card>
        <CardTitle width="w-48" sub />
        {intro ? <B className="mt-4 h-9 w-56 rounded-full" /> : null}
        <div className="mt-5 flex flex-col items-center">
          <B className="h-20 w-36 rounded-t-full" />
          <B className="mt-3 h-3 w-20" />
        </div>
        <Rows count={rows} height="h-9" />
      </Card>
      <Card>
        <CardTitle width="w-48" />
        <B className="mt-3 h-3.5 w-64 max-w-full" />
      </Card>
    </div>
  );
}

const tileWidth =
  "w-full @[22.5rem]:w-[calc((100%-0.75rem)/2)] @[33.75rem]:w-[calc((100%-1.5rem)/3)] @[45rem]:w-[calc((100%-2.25rem)/4)] @[56.25rem]:w-[calc((100%-3rem)/5)]";

/** Same flex-wrap tiles as ActivityTiles: icon chip + number, label, bar, caption. */
function Tiles({ count, center = true }: { count: number; center?: boolean }) {
  return (
    <div className="@container mt-4">
      <div className={`flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={`flex ${tileWidth}`}>
            <div className="flex w-full flex-col rounded-2xl border border-[#e7eaee] bg-white p-4">
              <div className="flex items-center justify-between">
                <B className="size-9 rounded-xl" />
                <B className="h-6 w-6" />
              </div>
              <B className="mt-2 h-3 w-20" />
              <B className="mt-3 h-1.5 w-full rounded-full" />
              <B className="mt-2 h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
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

function HomeGrid({
  children,
  rows,
  intro,
}: {
  children: ReactNode;
  rows?: number;
  intro?: boolean;
}) {
  return (
    <Shell>
      <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="flex min-w-0 flex-col gap-6 self-start">{children}</div>
        <SideColumn rows={rows} intro={intro} />
      </div>
    </Shell>
  );
}

export function InvestorHomeSkeleton() {
  return (
    <HomeGrid rows={6}>
      <Card>
        <CardTitle width="w-64" sub />
        <Tiles count={4} center={false} />
      </Card>
      <Treemap />
    </HomeGrid>
  );
}

export function SellerHomeSkeleton() {
  return (
    <HomeGrid rows={8} intro>
      <Card>
        <CardTitle width="w-64" sub />
        <Tiles count={5} />
      </Card>
      {/* t74: mirrors the "Cómo va tu empresa" dashboard: KPI tiles, then the two evolution charts and the gauges. */}
      <Card>
        <CardTitle width="w-64" />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-xl border border-[#e7eaee] p-3">
              <B className="h-3 w-20" />
              <B className="mt-2 h-5 w-16" />
              <B className="mt-3 h-6 w-full rounded-md" />
            </div>
          ))}
        </div>
        <B className="mt-6 h-4 w-28" />
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((box) => (
            <div key={box} className="rounded-xl border border-[#e7eaee] p-4">
              <B className="h-3 w-40" />
              <div className="mt-4 flex h-40 items-end justify-around gap-4 px-2">
                {[40, 70, 30, 55, 85].map((height, index) => (
                  <div key={index} className="w-8" style={{ height: `${height}%` }}>
                    <B className="h-full w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <B className="mt-6 h-4 w-32" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-xl border border-[#e7eaee] p-4">
              <B className="h-3 w-28" />
              <B className="mt-3 h-6 w-16" />
              <B className="mt-3 h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </HomeGrid>
  );
}

export function AdvisorHomeSkeleton() {
  return (
    <HomeGrid rows={4}>
      <Card>
        <CardTitle width="w-64" />
        <Tiles count={5} />
      </Card>
      <Treemap />
    </HomeGrid>
  );
}

/** Admin home breakdown card: title + total, then label/value rows with a bar each. */
function BarsCard({ rows }: { rows: number }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <B className="h-7 w-44" />
        <div className="flex flex-col items-end gap-1">
          <B className="h-3 w-8" />
          <B className="h-6 w-8" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index}>
            <div className="flex justify-between">
              <B className="h-3 w-24" />
              <B className="h-3 w-12" />
            </div>
            <B className="mt-2 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AdminHomeSkeleton() {
  return (
    <Shell>
      <Card>
        <CardTitle width="w-32" />
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="w-full rounded-2xl border border-[#e7eaee] p-4 sm:w-[calc((100%-0.75rem)/2)] xl:w-[calc((100%-3rem)/5)]">
              <div className="flex items-center justify-between">
                <B className="size-9 rounded-xl" />
                <B className="h-6 w-8" />
              </div>
              <B className="mt-2 h-3 w-24" />
              <B className="mt-3 h-1.5 w-full rounded-full" />
              <B className="mt-2 h-3 w-20" />
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        {[4, 2, 3, 3].map((rows, index) => (
          <BarsCard key={index} rows={rows} />
        ))}
      </div>
      <Treemap />
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

/** Mirrors MarketCard: 16/7 photo, sector tile, two text blocks, Facturación | EBITDA, then the price across both columns. */
function MarketCardBone() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white">
      <div className="relative">
        <Bare className="aspect-[16/7] max-h-52 w-full rounded-none" />
        <div className="absolute bottom-0 left-4 size-20 translate-y-1/2 rounded-2xl border-[3px] border-white bg-[#eef1f5]" />
      </div>
      <div className="flex flex-col px-5 pt-3 pb-5">
        <B className="ml-[6.75rem] h-6 w-28 rounded-md" />
        <B className="mt-2 h-5 w-16 rounded-md" />
        <B className="mt-2 h-4 w-full" />
        <B className="mt-1 h-4 w-4/5" />
        <B className="mt-2 h-4 w-full" />
        <B className="mt-1 h-4 w-3/4" />
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#eceff4]">
          <div className="grid grid-cols-2">
            {[0, 1].map((cell) => (
              <div key={cell} className="flex flex-col items-center gap-2 py-3">
                <B className="h-3 w-16" />
                <B className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2 border-t border-[#eceff4] px-4 py-3">
            <B className="h-3 w-24" />
            <B className="h-5 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketSkeleton({
  heading = true,
  cards = 6,
}: {
  heading?: boolean;
  cards?: number;
}) {
  return (
    <Shell>
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {heading ? (
          <Bare className="h-9 w-40" />
        ) : (
          <span className="hidden sm:block" />
        )}
        <Bare className="h-7 w-32 justify-self-center rounded-full" />
      </div>
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <div className="grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[1fr_1fr_auto] xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto]">
          <div className="col-span-2 sm:col-span-3 xl:col-span-1">
            <Field />
          </div>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={index === 2 ? "" : "col-span-2 sm:col-span-1"}
            >
              <Field />
            </div>
          ))}
          <B className="size-11 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(21rem,100%),1fr))] gap-5">
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

function SummaryCard({ tiles }: { tiles: number }) {
  return (
    <Card>
      <CardTitle width="w-56" sub={tiles === 5} />
      <Tiles count={tiles} />
    </Card>
  );
}

/** Buyer /procesos: activity summary, then one card per process (title, stepper, conversation). */
export function ProcessesSkeleton() {
  return (
    <Shell>
      <SummaryCard tiles={4} />
      {[0, 1].map((index) => (
        <Card key={index}>
          <div className="flex items-center justify-between gap-3">
            <B className="h-6 w-40" />
            <B className="h-9 w-28 rounded-full" />
          </div>
          <Stepper />
          <div className="mt-4 grid gap-3 md:grid-cols-[3fr_2fr]">
            <B className="h-28 w-full rounded-xl" />
            <B className="h-28 w-full rounded-xl" />
          </div>
        </Card>
      ))}
    </Shell>
  );
}

/** Seller /mi-empresa/procesos: summary (5 tiles), pending actions + meetings, active processes. */
export function SellerProcessesSkeleton() {
  return (
    <Shell>
      <SummaryCard tiles={5} />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((index) => (
          <Card key={index}>
            <B className="h-5 w-56" />
            <B className="mt-3 h-3.5 w-48" />
            <B className="mt-2 h-3 w-full" />
          </Card>
        ))}
      </div>
      <Bare className="h-4 w-36" />
      <Card>
        <B className="h-4 w-56" />
        <B className="mt-3 h-3 w-80 max-w-full" />
      </Card>
    </Shell>
  );
}

/** Closed deal (comprador /inversor/compra, vendedor /mi-empresa/venta): hero, 4 figures, signed docs, next steps. */
export function SaleSkeleton() {
  return (
    <Shell>
      <Bare className="h-48 w-full rounded-3xl" />
      <div className="-mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="flex gap-3 rounded-2xl border border-[#e7eaee] bg-white p-4"
          >
            <B className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1">
              <B className="h-3 w-20" />
              <B className="mt-2 h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
      <Card>
        <B className="h-5 w-48" />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <B key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </Card>
      <Bare className="h-5 w-36" />
      <div className="-mt-2 grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="flex gap-3 rounded-xl border border-[#e7eaee] bg-white p-4"
          >
            <B className="size-9 shrink-0 rounded-full" />
            <div className="flex-1">
              <B className="h-4 w-40" />
              <B className="mt-2 h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
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

/** Mirrors the advisor listing card: navy header (name, rating, sector chips), service rows, centred action. */
function AdvisorCardBone({ rank = false }: { rank?: boolean }) {
  return (
    <div
      className={rank ? "rounded-2xl border border-[#e7eaee] bg-white p-3" : ""}
    >
      {rank ? (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-2">
            <B className="h-6 w-24 rounded-full" />
            <B className="h-6 w-16" />
          </div>
          <B className="h-6 w-20" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
        <div className="bg-[#d5dce5] p-4">
          <div className="flex justify-between">
            <div className="h-4 w-48 rounded-lg bg-[#c4ccd8]" />
            <div className="h-8 w-20 rounded-lg bg-[#c4ccd8]" />
          </div>
          <div className="mt-3 flex max-h-[3.5rem] flex-col gap-1.5">
            <div className="flex gap-1.5">
              <div className="h-6 w-28 rounded-full bg-[#c4ccd8]" />
              <div className="h-6 w-24 rounded-full bg-[#c4ccd8]" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-6 w-32 rounded-full bg-[#c4ccd8]" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex justify-between">
              <B className="h-3.5 w-40" />
              <B className="h-3.5 w-24" />
            </div>
          ))}
          <B className="mt-2 h-8 w-32 self-center rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function AdvisorySkeleton() {
  return (
    <Shell>
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-4 lg:items-end">
          {[0, 1, 2, 3].map((index) => (
            <Field key={index} />
          ))}
        </div>
      </div>
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,26rem),1fr))]">
        {[0, 1, 2, 3].map((index) => (
          <AdvisorCardBone key={index} />
        ))}
      </div>
    </Shell>
  );
}

/** Mirrors /cuenta: profile card + agreement thumbnail, (buyers only) role profile, password and delete cards. */
export function AccountSkeleton({ buyer = false }: { buyer?: boolean }) {
  return (
    <Shell>
      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <div
            className={
              buyer
                ? "grid items-start gap-5 md:grid-cols-[8rem_minmax(0,1fr)]"
                : "grid items-start gap-5"
            }
          >
            {buyer ? <B className="size-32 rounded-2xl" /> : null}
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((index) => (
                <Field key={index} />
              ))}
            </div>
          </div>
        </Card>
        <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
          <div className="flex-1 space-y-2 p-4">
            <B className="h-3 w-16" />
            <B className="h-3 w-3/4" />
            <B className="h-10 w-full" />
            <B className="h-2 w-full" />
            <B className="h-2 w-5/6" />
          </div>
          <div className="flex items-center gap-2 border-t border-[#e7eaee] px-4 py-3">
            <B className="size-4 rounded" />
            <B className="h-3 w-28" />
          </div>
        </div>
      </div>
      {buyer ? (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <B className="h-6 w-56" />
              <B className="mt-2 h-3 w-80 max-w-full" />
            </div>
            <B className="h-6 w-24 rounded-full" />
          </div>
          <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((index) => (
                <Field key={index} />
              ))}
              <div className="sm:col-span-2">
                <B className="h-3 w-24" />
                <B className="mt-2 h-20 w-full rounded-xl" />
              </div>
            </div>
            <B className="hidden h-72 rounded-2xl xl:block" />
          </div>
        </Card>
      ) : null}
      <Card>
        <B className="h-6 w-32" />
        <B className="mt-2 h-3 w-72 max-w-full" />
        <div className="mt-4 grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          {[0, 1, 2].map((index) => (
            <Field key={index} />
          ))}
          <B className="h-10 w-40 rounded-xl" />
        </div>
      </Card>
      <div className="rounded-2xl border border-[#f1d4d1] bg-white p-5">
        <B className="h-6 w-40" />
        <B className="mt-2 h-3 w-96 max-w-full" />
        <div className="mt-4 grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          {[0, 1].map((index) => (
            <Field key={index} />
          ))}
          <B className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </Shell>
  );
}

export function ProjectSkeleton() {
  return (
    <Shell>
      <Bare className="h-4 w-36" />
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#1c2740] px-6 py-8 sm:px-8 sm:py-10">
        <div className="mb-5 flex items-start justify-between">
          <Bare className="h-11 w-24 rounded-full bg-white/20" />
          <Bare className="size-11 rounded-full bg-white/20" />
        </div>
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <Bare className="size-10 rounded-2xl bg-white/15" />
          <Bare className="mt-3 h-12 w-64 bg-white/20 sm:h-16 sm:w-80" />
          <div className="mt-4 flex gap-2">
            <Bare className="h-6 w-20 rounded-full bg-white/15" />
            <Bare className="h-6 w-24 rounded-full bg-white/15" />
            <Bare className="h-6 w-16 rounded-full bg-white/15" />
          </div>
        </div>
      </div>
      <Tabs count={3} />
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex gap-1 overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white p-1.5">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Bare key={index} className={`h-11 shrink-0 rounded-xl ${index === 0 ? "w-28 bg-[#1c2740]/80" : "w-24"}`} />
          ))}
        </div>
      </div>
      <Card>
        <div className="flex items-center gap-3">
          <B className="size-9 rounded-xl" />
          <B className="h-6 w-40" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <B key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    </Shell>
  );
}

export function CompanyDetailsSkeleton() {
  const panel = (wide: boolean, index: number) => (
    <Card key={index}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <B className="size-8 rounded-full" />
          <B className={wide ? "h-7 w-48" : "h-7 w-64"} />
        </div>
        <B className="h-7 w-28 rounded-full" />
      </div>
      {wide ? (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((field) => (
              <Field key={field} />
            ))}
          </div>
          <B className="mt-5 h-28 w-full rounded-xl" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <B className="h-28 w-full rounded-2xl" />
            <B className="h-28 w-full rounded-2xl" />
          </div>
        </>
      ) : index === 1 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, tile) => (
            <B key={tile} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : null}
    </Card>
  );
  return (
    <Shell>
      <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Bare className="h-9 w-48" />
        <div className="justify-self-center">
          <Tabs />
        </div>
        <div className="hidden lg:block" aria-hidden />
      </div>
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2 overflow-hidden lg:hidden">
          <B className="size-9 shrink-0 rounded-full" />
          {[0, 1, 2, 3].map((index) => (
            <Bare key={index} className="h-9 w-32 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="pointer-events-none absolute top-0 right-0 hidden lg:block">
          <div className="hidden xl:block w-[17.25rem] rounded-2xl border border-[#e7eaee] bg-white p-3">
            <div className="mb-3 flex items-center gap-3">
              <B className="size-12 rounded-full" />
              <div className="flex flex-col gap-2">
                <B className="h-3.5 w-28" />
                <B className="h-3 w-20" />
              </div>
            </div>
            {[0, 1, 2, 3].map((index) => (
              <B key={`rail-${index}`} className="mt-2 h-9 w-full rounded-lg" />
            ))}
          </div>
          <B className="size-11 rounded-full xl:hidden" />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          {panel(true, 0)}
          {panel(false, 1)}
          {panel(false, 2)}
        </div>
      </div>
    </Shell>
  );
}

export function DocumentsSkeleton() {
  return (
    <Shell>
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f4f6fb] px-4 py-3">
          <div className="flex flex-1 items-center gap-3">
            <B className="size-8 shrink-0 rounded-full" />
            <B className="h-4 w-56 max-w-full" />
            <B className="size-4 shrink-0 rounded-full" />
          </div>
          <B className="h-4 w-28" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-[#eef0f3] bg-[#fbfbfc] px-3"
            >
              <B className="h-10 w-12 rounded-xl" />
              <B className="h-3.5 w-24" />
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
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

function AdminToolbar({
  title = "w-40",
  controls = 2,
  sub = true,
}: {
  title?: string;
  controls?: number;
  sub?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Bare className={`h-9 ${title}`} />
        {sub ? <Bare className="mt-2 h-3.5 w-80 max-w-full" /> : null}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: controls }, (_, index) => (
          <Bare
            key={index}
            className={`h-9 rounded-full ${index === 0 && controls > 1 ? "w-48" : "w-32"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminListSkeleton({
  kind,
}: {
  kind:
    | "advisors"
    | "accounts"
    | "companies"
    | "connections"
    | "waitlist"
    | "valoraciones"
    | "messages";
}) {
  if (kind === "messages") {
    // /admin/mensajes: real h1 comes from SignedInPage; two labelled sections (contacto, suscriptores).
    return (
      <Shell>
        {[0, 1].map((index) => (
          <div key={index} className="flex flex-col gap-3">
            <Bare className="h-4 w-40" />
            <Card>
              <Rows count={3} />
            </Card>
          </div>
        ))}
      </Shell>
    );
  }

  if (kind === "accounts") {
    // Mirrors AdminAccounts: title + search + two filters, then a 3-up grid of compact account cards.
    return (
      <Shell>
        <AdminToolbar title="w-32" controls={3} sub={false} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <Card key={index} className="!p-3">
              <div className="flex items-start gap-3">
                <B className="size-8 shrink-0 rounded-full" />
                <div className="flex-1">
                  <B className="h-3.5 w-32" />
                  <B className="mt-2 h-3 w-40" />
                </div>
                <B className="h-5 w-14 rounded-full" />
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex justify-between">
                    <B className="h-3 w-20" />
                    <B className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Shell>
    );
  }

  if (kind === "companies") {
    // Mirrors AdminCompanies: header (title + search + status + sort icon), then marketplace cards with the legal line centred above each.
    return (
      <Shell>
        <AdminToolbar title="w-36" controls={3} sub={false} />
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(21rem,100%),1fr))] gap-5">
          {Array.from({ length: 6 }, (_, index) => (
            <li
              key={index}
              className="flex flex-col gap-2 rounded-2xl border-2 border-[#e7eaee] p-1.5"
            >
              <MarketCardBone />
              <Bare className="mx-auto mb-1 h-3 w-48" />
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

  if (kind === "waitlist" || kind === "valoraciones") {
    return (
      <Shell>
        <AdminToolbar title="w-44" controls={2} />
        <Card>
          <Rows count={4} />
        </Card>
      </Shell>
    );
  }

  // Advisors: ranking header over the same navy listing card the buyers see, two per row.
  return (
    <Shell>
      <AdminToolbar controls={2} />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <AdvisorCardBone key={index} rank />
        ))}
      </div>
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
            <B className="mt-4 h-40 w-full rounded-xl" />
            <B className="mt-3 h-3 w-28" />
          </Card>
        ))}
      </div>
    </Shell>
  );
}

/**
 * t73: /admin/empresas/[slug] while loading. Mirrors the real page: back link, navy banner with the
 * SABI pill (and drop hint) top-right, the tabs row, the sticky section-nav pill bar and the
 * collapsible report sections (icon square, title, chevron, KPI grid).
 */
export function AdminCompanySkeleton() {
  const bone = "rounded-lg bg-[#e9edf2]";
  const section = "rounded-2xl border border-[#e6e9f0] bg-white shadow-[0_1px_2px_rgba(28,39,64,0.04)]";
  return (
    <div className="flex w-full animate-pulse flex-col gap-6 motion-reduce:animate-none" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className={`h-4 w-40 ${bone}`} />
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#1c2740] px-6 py-[4.625rem] sm:px-8 sm:py-[5.125rem]">
        <div className="absolute top-6 right-6 flex flex-col items-center gap-1">
          <div className="h-10 w-44 rounded-full bg-white/20" />
          <div className="hidden h-3 w-36 rounded bg-white/10 sm:block" />
        </div>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 pt-2">
          <div className="h-14 w-3/4 rounded-xl bg-white/20 sm:h-16" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-white/15" />
            <div className="h-4 w-24 rounded bg-white/15" />
          </div>
        </div>
      </div>
      <div className="flex gap-1 border-b border-[#e6e9f0] pb-2">
        {[28, 24, 24].map((w, i) => (
          <div key={i} className={`h-8 ${bone}`} style={{ width: `${w * 0.25}rem` }} />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <div className="sticky top-0 z-20 py-2">
          <div className="flex items-center gap-1 overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white p-1.5">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className={`h-9 shrink-0 rounded-xl ${i === 0 ? "bg-[#1c2740]/80" : "bg-[#eef0f4]"}`} style={{ width: `${5.5 + (i % 3)}rem` }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 3 }, (_, s) => (
          <div key={s} className={section}>
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
              <div className="size-9 shrink-0 rounded-xl bg-[#e6f4f2]" />
              <div className={`h-5 w-48 ${bone}`} />
              <div className="ml-auto size-5 rounded bg-[#eef0f4]" />
            </div>
            <div className="border-t border-[#eef0f4] px-4 pt-4 pb-5 sm:px-6 sm:pb-6">
              <div className={`mb-4 h-3 w-2/3 ${bone}`} />
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-24 rounded-xl border border-[#eef0f4] bg-[#fafbfc]" />
                ))}
              </div>
              {s === 1 ? <div className="mt-4 h-56 rounded-xl border border-[#eef0f4] bg-[#fafbfc]" /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Ficha pública tab: filter bar, three marketplace cards, then the buyer resumen. */
export function FichaPublicaSkeleton() {
  return (
    <Shell>
      <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Bare className="h-9 w-48" />
        <div className="justify-self-center">
          <Tabs />
        </div>
        <div className="hidden lg:block" aria-hidden />
      </div>
      <Card>
        <B className="h-5 w-72" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Field key={index} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <MarketCardBone key={index} />
          ))}
        </div>
      </Card>
      <Card>
        <B className="h-5 w-72" />
        <div className="mt-4 flex items-center gap-1 overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white p-1.5">
          {Array.from({ length: 8 }, (_, index) => (
            <B
              key={index}
              className={`h-9 shrink-0 rounded-xl ${index === 0 ? "w-24 bg-[#1c2740]/80" : index % 3 === 1 ? "w-20" : "w-28"}`}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <B key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    </Shell>
  );
}
