"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IntBadge } from "@/components/shell/int-badge";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingMark } from "@/components/landing/landing-mark";

export function PublicMenu({
  signedIn,
  showInt = false,
}: {
  signedIn: boolean;
  showInt?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div
      data-releva-menu
      data-menu-open={mobileOpen ? "true" : undefined}
      className="releva-menu relative mx-auto flex w-full max-w-[1440px] items-center rounded-full px-2 py-1.5 sm:px-4 sm:py-2"
    >
      {showInt ? (
        <span className="absolute -top-2 right-6 z-30 sm:right-8">
          <IntBadge />
        </span>
      ) : null}
      <Link href="/" className="relative z-20 flex min-h-11 min-w-0 shrink-0 items-center gap-2 pl-2" aria-label="Relify">
        <LandingMark />
      </Link>
      <LandingNav
        menuOpen={mobileOpen}
        onMenuOpenChange={setMobileOpen}
        signedIn={signedIn}
        accountHref={signedIn ? "/cuenta" : "/entrar"}
      />
    </div>
  );
}
