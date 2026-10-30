import type { ReactNode } from "react";

/**
 * Route-level loading state that mirrors SignedInPage: an optional h1 bone (text-3xl) and the
 * same mt-6 gap, so loading.tsx -> Suspense fallback -> content keeps one layout.
 */
export function RouteLoading({ title = false, children }: { title?: boolean; children: ReactNode }) {
  return (
    <>
      {title ? <div aria-hidden className="h-9 w-48 animate-pulse rounded-lg bg-[#d5dce5] motion-reduce:animate-none" /> : null}
      <div className={title ? "mt-6" : undefined}>{children}</div>
    </>
  );
}
