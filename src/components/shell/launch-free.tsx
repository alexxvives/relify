"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BadgeCheck } from "lucide-react";
import { launchFreeCopy } from "@/lib/launch-mode";

/**
 * S43: the server reads LAUNCH_FREE_MODE once in the signed-in shell and hands the answer to client components
 * (plan cards, publish, add company, advisor subscription and deposit), so none of them shows a Stripe CTA while it
 * is on. The server still enforces it: checkout starters refuse to call Stripe in launch mode.
 */
const LaunchFreeContext = createContext(false);

export function LaunchFreeProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <LaunchFreeContext.Provider value={value}>{children}</LaunchFreeContext.Provider>;
}

export function useLaunchFree(): boolean {
  return useContext(LaunchFreeContext);
}

/** The short state that replaces a payment button. */
export function LaunchFreeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      data-launch-free
      className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e7f6ee] px-3 py-1.5 text-sm font-semibold text-[#17663a] ${className}`}
    >
      <BadgeCheck className="size-4" aria-hidden />
      {launchFreeCopy.badge}
    </span>
  );
}
