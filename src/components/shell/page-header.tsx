import type { ReactNode } from "react";

/**
 * S27: one page-title system for every signed-in page. The title row has a fixed height equal to the
 * title's line height, so the h1 lands on the same pixel row whether or not the page puts controls
 * next to it (taller controls are centred on the row and never push the title down).
 */
export const pageTitleClass =
  "min-w-0 truncate text-2xl leading-8 tracking-tight text-public-ink sm:text-[1.75rem] sm:leading-[2.1875rem]";
export const pageHeaderRowClass = "flex h-8 min-w-0 items-center justify-between gap-3 sm:h-[2.1875rem]";
/** Space between the title row and the first block of the page. */
export const pageHeaderGapClass = "mt-5";

export function PageHeader({ title, actions = null, className = "" }: { title: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={`${pageHeaderRowClass} ${className}`.trim()}>
      <h1 className={pageTitleClass}>{title}</h1>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
