"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { Logo } from "@/components/logo";
import { landingCopy } from "@/lib/landing-copy";

export function PublicMenu({ signedIn }: { signedIn: boolean }) {
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    const menu = document.querySelector("[data-releva-menu]");
    if (!(menu instanceof HTMLElement)) {
      return;
    }

    const read = () => {
      const rect = menu.getBoundingClientRect();
      const hits = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const behind = hits.find((node) => !node.closest("header"));
      setOnDark(Boolean(behind?.closest(".releva-hero-glass, .bg-public-ink")));
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  return (
    <div
      data-releva-menu
      className="releva-menu relative mx-auto flex w-full max-w-[1440px] items-center rounded-full px-2 py-2 sm:px-4"
    >
      <Link href="/" className="shrink-0 pl-2" aria-label="Relify">
        <Logo />
      </Link>
      <LandingNav
        onDark={onDark}
        accountHref={signedIn ? "/cuenta" : landingCopy.waitlistNav.href}
        accountLabel={signedIn ? landingCopy.accountCta : landingCopy.signInCta}
      />
    </div>
  );
}
