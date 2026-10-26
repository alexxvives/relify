import { BadgeCheck, CircleAlert, CircleHelp, Info } from "lucide-react";
import type { ReactNode } from "react";

/** Dark tooltip bubble shared by every hover/tap hint in the app. */
export const tooltipBubble =
  "rounded-xl bg-[#1c2740] px-3 py-2 text-left text-xs leading-5 font-normal whitespace-pre-line text-white shadow-lg";

const icons = { help: CircleHelp, info: Info, warning: CircleAlert, verified: BadgeCheck } as const;

const iconTone = {
  ink: "text-[#8b95a7] hover:text-[#465ab4]",
  light: "text-white/70 hover:text-white",
  warning: "text-[#b54708] hover:text-[#93370d]",
  verified: "text-[#465ab4]",
  verifiedLight: "text-[#7ee2a8]",
} as const;

/**
 * Icon with a tooltip on hover, keyboard focus and tap (the icon is focusable, so a tap focuses it).
 * `align` anchors the bubble to the icon's start, centre or end; `side` puts it above or below.
 */
export function InfoHint({
  text,
  icon = "help",
  tone = "ink",
  align = "start",
  side = "top",
  width = "md",
  size = "md",
  children,
}: {
  text: string;
  icon?: keyof typeof icons;
  tone?: keyof typeof iconTone;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  width?: "auto" | "md" | "lg";
  size?: "sm" | "md";
  /** Optional custom trigger instead of the icon. */
  children?: ReactNode;
}) {
  const Icon = icons[icon];
  const place = align === "center" ? "left-1/2 -translate-x-1/2" : align === "end" ? "right-0" : "left-0";
  const vertical = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const w = width === "lg" ? "w-96 max-w-[calc(100vw-2rem)]" : width === "md" ? "w-64 max-w-[calc(100vw-2rem)]" : "w-max max-w-64";

  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={text}
        className={`inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 ${children ? "" : `${size === "sm" ? "size-4" : "size-5"} ${iconTone[tone]}`}`}
      >
        {children ?? <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />}
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 hidden group-focus-within:block group-hover:block ${vertical} ${w} ${place} ${tooltipBubble}`}
      >
        {text}
      </span>
    </span>
  );
}
