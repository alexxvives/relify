import type { ReactNode } from "react";

// Route-level loading states for pages that have no Suspense fallback of their own. Each one
// prints the page's real h1 (same classes as SignedInPage) and white cards shaped like the
// loaded page, so a hard load never flashes a different layout.

const bone = "rounded-lg bg-[#e9edf2]";
const card = "rounded-2xl border border-[#e7eaee] bg-white p-5";

function Frame({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div
      className="animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando…</span>
      {title ? (
        <h1 className="text-3xl tracking-tight text-public-ink">{title}</h1>
      ) : null}
      <div
        className={title ? "mt-6 flex flex-col gap-6" : "flex flex-col gap-6"}
      >
        {children}
      </div>
    </div>
  );
}

function Lines({ n, last = "w-2/3" }: { n: number; last?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className={`h-3 ${bone} ${i === n - 1 ? last : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** Empty-state pages (búsquedas, ocultas, dataroom): title + one note card. */
export function NoteSkeleton({ title }: { title: string }) {
  return (
    <Frame title={title}>
      <div className={card}>
        <div className={`h-4 w-48 ${bone}`} />
        <div className="mt-3">
          <Lines n={1} last="w-96 max-w-full" />
        </div>
      </div>
    </Frame>
  );
}

/** Buyer profile: company data strip, then the form card with the preview card at its side. */
export function ProfileSkeleton({ title }: { title: string }) {
  return (
    <Frame title={title}>
      <div className={card}>
        <div className={`h-5 w-48 ${bone}`} />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`size-8 ${bone}`} />
              <div className="flex-1">
                <Lines n={2} last="w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={card}>
        <div className={`h-5 w-56 ${bone}`} />
        <div className={`mt-2 h-3 w-80 max-w-full ${bone}`} />
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>
                <div className={`h-3 w-24 ${bone}`} />
                <div className={`mt-2 h-10 w-full ${bone}`} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <div className={`h-3 w-24 ${bone}`} />
              <div className={`mt-2 h-24 w-full ${bone}`} />
            </div>
          </div>
          <div className="hidden h-72 rounded-2xl bg-[#e9edf2] lg:block" />
        </div>
      </div>
    </Frame>
  );
}

/** Plans: dark hero, monthly/annual switch, three plan cards. */
export function PlansSkeleton({ title }: { title: string }) {
  return (
    <Frame title={title}>
      <div className="h-44 rounded-3xl bg-[#d5dce5]" />
      <div className={`mx-auto h-9 w-40 rounded-full bg-[#e9edf2]`} />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${card} h-96`}>
            <div className={`size-9 ${bone}`} />
            <div className={`mt-4 h-4 w-20 ${bone}`} />
            <div className={`mt-3 h-8 w-36 ${bone}`} />
            <div className="mt-6">
              <Lines n={5} last="w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Tendencias: tab row, then a list of article cards. */
export function TrendsSkeleton({ title }: { title: string }) {
  return (
    <Frame title={title}>
      <div className="-mt-3 h-3.5 w-96 max-w-full rounded-lg bg-[#d5dce5]" />
      <div className="flex gap-3">
        {[14, 14, 24].map((w, i) => (
          <div
            key={i}
            className="h-7 rounded-full bg-[#d5dce5]"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={card}>
            <div className={`h-3 w-28 ${bone}`} />
            <div className={`mt-3 h-4 w-72 max-w-full ${bone}`} />
            <div className="mt-3">
              <Lines n={2} />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Company detail (admin ficha, conexión, seller process, encargo): back link, dark banner, tabs, cards; optional buyer card at the side. */
export function DetailSkeleton({ side = false }: { side?: boolean }) {
  const main = (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="h-56 rounded-3xl bg-[#d5dce5] sm:h-80" />
      <div className="flex gap-4">
        {[40, 16, 24].map((w, i) => (
          <div
            key={i}
            className={`h-5 ${bone}`}
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>
      <div className={card}>
        <div className={`h-4 w-44 ${bone}`} />
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`size-8 shrink-0 ${bone}`} />
              <div className="flex-1">
                <Lines n={2} last="w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Lines n={2} />
        </div>
      </div>
    </div>
  );
  return (
    <Frame>
      <div className={`h-4 w-36 ${bone}`} />
      {side ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
          {main}
          <div className={`${card} h-[30rem]`}>
            <div className={`h-4 w-28 ${bone}`} />
            <div className={`mt-4 size-12 rounded-xl bg-[#e9edf2]`} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-14 ${bone}`} />
              ))}
            </div>
            <div className="mt-4">
              <Lines n={4} />
            </div>
          </div>
        </div>
      ) : (
        main
      )}
    </Frame>
  );
}
