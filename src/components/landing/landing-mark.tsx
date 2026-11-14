"use client";

import { useEffect, useState, type ComponentType } from "react";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { Logo } from "@/components/shell/logo";
import { useLandingAurora } from "@/components/landing/landing-motion";
import type { ElectricLogoProps } from "@/components/ElectricLogo";

function subscribeTab(onStoreChange: () => void) {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function useTabVisible() {
  return useSyncExternalStore(
    subscribeTab,
    () => document.visibilityState === "visible",
    () => true,
  );
}

/** v2 desktop trial: ElectricLogo on `/logo.svg`. Wordmark everywhere else. */
export function LandingMark({ electric = false }: { electric?: boolean }) {
  const desktop = useLandingAurora();
  const tabVisible = useTabVisible();
  const [Electric, setElectric] = useState<ComponentType<ElectricLogoProps> | null>(null);

  useEffect(() => {
    if (!electric || !desktop) {
      return;
    }
    let alive = true;
    void import("@/components/ElectricLogo").then((mod) => {
      if (alive) {
        setElectric(() => mod.default);
      }
    });
    return () => {
      alive = false;
    };
  }, [electric, desktop]);

  if (!electric || !desktop) {
    return <Logo />;
  }

  return (
    <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center" aria-hidden>
      {tabVisible && Electric ? (
        <Electric
          src="/logo.svg"
          color="#10b949"
          glowColor="#00f2ac"
          scale={0.7}
          strands={4}
          bend={0.6}
          crackle={1.5}
          arcs={1}
          speed={2.5}
          interactive
          theme="light"
          className="h-12 w-12"
        />
      ) : (
        <Image src="/logo.svg" alt="" width={48} height={48} className="h-12 w-12" />
      )}
    </span>
  );
}
