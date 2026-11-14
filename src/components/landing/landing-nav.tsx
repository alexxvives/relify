"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { landingCopy } from "@/lib/landing-copy";

const solidLink =
  "inline-flex h-11 min-h-11 items-center justify-center rounded-full bg-public-clay px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-12px_rgb(15_110_115_/_0.7)] transition hover:bg-public-clay-deep";

function ghostLink(onDark: boolean) {
  return `inline-flex h-11 min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium transition ${
    onDark
      ? "border-white/45 text-white hover:bg-white/10"
      : "border-public-ink/18 text-public-ink hover:bg-public-sand"
  }`;
}

export function LandingNav({
  onDark = false,
  menuOpen,
  onMenuOpenChange,
  signedIn,
  accountHref,
}: {
  onDark?: boolean;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  signedIn: boolean;
  accountHref: string;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <nav
        className="pointer-events-auto absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 lg:flex xl:gap-1"
        aria-label="Secciones"
        onMouseLeave={() => setOpen(null)}
      >
        {landingCopy.nav.map((group) => (
          <div key={group.label} className="relative" onMouseEnter={() => setOpen(group.links.length > 1 ? group.label : null)}>
            {group.links.length === 1 && group.links[0] ? (
              <Link
                href={group.links[0].href}
                className={`flex min-h-11 items-center rounded-full px-2.5 py-2 text-[15px] xl:px-3 ${onDark ? "text-white hover:text-white" : "text-public-muted hover:text-public-ink"}`}
              >
                {group.label}
              </Link>
            ) : (
            <button
              type="button"
              className={`flex min-h-11 items-center gap-1 rounded-full px-2.5 py-2 text-[15px] xl:px-3 ${onDark ? "text-white hover:text-white" : "text-public-muted hover:text-public-ink"}`}
              aria-expanded={open === group.label}
            >
              {group.label}
              <ChevronDown className={`size-4 transition ${open === group.label ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            )}
            {group.links.length > 1 ? (
            <div
              className={`absolute top-full left-1/2 z-50 min-w-56 -translate-x-1/2 pt-3 transition ${open === group.label ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
            >
              <div className="rounded-3xl bg-public-card p-2 text-public-ink shadow-public">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="flex min-h-11 items-center rounded-2xl px-4 text-sm hover:bg-public-sand">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            ) : null}
          </div>
        ))}
        <Link
          href={landingCopy.waitlistNav.href}
          className={`flex min-h-11 items-center rounded-full px-2.5 py-2 text-[15px] xl:px-3 ${onDark ? "text-white hover:bg-white/15" : "text-public-ink hover:bg-public-sand"}`}
        >
          {landingCopy.waitlistNav.label}
        </Link>
      </nav>
      <div className="relative z-20 ml-auto flex items-center gap-2">
      {signedIn ? (
        <Link href={accountHref} className={`${solidLink} max-lg:hidden`}>
          {landingCopy.accountCta}
        </Link>
      ) : (
        <div className="max-lg:hidden flex items-center gap-2">
          <Link href="/entrar" className={ghostLink(onDark)}>
            {landingCopy.signInCta}
          </Link>
          <Link href="/registro" className={solidLink}>
            {landingCopy.tryFreeCta}
          </Link>
        </div>
      )}
      <button
        type="button"
        className={`inline-flex size-11 items-center justify-center lg:hidden ${onDark ? "text-white" : "text-public-ink"}`}
        aria-expanded={menuOpen}
        aria-controls="landing-mobile-menu"
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <BottomSheet
        open={menuOpen}
        title="Menú"
        onClose={() => onMenuOpenChange(false)}
        footer={
          signedIn ? (
            <Link
              href={accountHref}
              className={`${solidLink} w-full`}
              onClick={() => onMenuOpenChange(false)}
            >
              {landingCopy.accountCta}
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/entrar"
                className={`${ghostLink(false)} w-full`}
                onClick={() => onMenuOpenChange(false)}
              >
                {landingCopy.signInCta}
              </Link>
              <Link
                href="/registro"
                className={`${solidLink} w-full`}
                onClick={() => onMenuOpenChange(false)}
              >
                {landingCopy.tryFreeCta}
              </Link>
            </div>
          )
        }
      >
        <div id="landing-mobile-menu" className="flex flex-col gap-1 pb-2">
          {landingCopy.nav.map((group) => (
            <div key={group.label}>
              {group.links.length === 1 && group.links[0] ? (
                <Link
                  href={group.links[0].href}
                  className="flex min-h-11 items-center rounded-2xl px-2 text-sm font-medium"
                  onClick={() => onMenuOpenChange(false)}
                >
                  {group.label}
                </Link>
              ) : (
                <>
              <p className="px-2 pt-3 text-xs tracking-[0.16em] text-public-muted uppercase">{group.label}</p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-2xl px-2 text-sm"
                  onClick={() => onMenuOpenChange(false)}
                >
                  {link.label}
                </Link>
              ))}
                </>
              )}
            </div>
          ))}
          <Link
            href={landingCopy.waitlistNav.href}
            className="flex min-h-11 items-center rounded-2xl px-2 text-sm font-medium"
            onClick={() => onMenuOpenChange(false)}
          >
            {landingCopy.waitlistNav.label}
          </Link>
        </div>
      </BottomSheet>
      </div>
    </>
  );
}
