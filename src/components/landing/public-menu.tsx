"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { Logo } from "@/components/logo";
import { landingCopy } from "@/lib/landing-copy";

const quietLink =
  "hidden h-11 items-center rounded-full px-4 text-sm transition md:inline-flex";
const solidLink =
  "inline-flex h-11 items-center rounded-full bg-public-clay px-4 text-sm text-white transition hover:bg-public-clay-deep";

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

  const quiet = onDark ? "text-white hover:text-white" : "text-public-muted hover:text-public-ink";

  return (
    <div
      data-releva-menu
      className="releva-menu relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 rounded-full px-2 py-2 sm:px-4"
    >
      <Link href="/" className="pl-2" aria-label="Releva">
        <Logo tone={onDark ? "paper" : "ink"} />
      </Link>
      <LandingNav onDark={onDark} />
      <div className="flex items-center gap-1 sm:gap-2">
        <Link href="/proyectos" className={`${quietLink} ${quiet}`}>
          {landingCopy.catalogCta}
        </Link>
        <Link href={signedIn ? "/cuenta" : "/entrar"} className={solidLink}>
          {signedIn ? landingCopy.accountCta : landingCopy.signInCta}
        </Link>
      </div>
    </div>
  );
}
