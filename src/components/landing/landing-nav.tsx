"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { landingCopy } from "@/lib/landing-copy";

const solidLink =
  "inline-flex h-11 min-h-11 items-center justify-center rounded-full bg-public-clay px-4 text-sm font-medium text-white transition hover:bg-public-clay-deep";

export function LandingNav({
  onDark = false,
  menuOpen,
  onMenuOpenChange,
  accountHref,
  accountLabel,
}: {
  onDark?: boolean;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  accountHref: string;
  accountLabel: string;
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
      <Link href={accountHref} className={`${solidLink} max-lg:hidden`}>
        {accountLabel}
      </Link>
      <button
        type="button"
        className={`inline-flex size-11 items-center justify-center lg:hidden ${onDark ? "text-white" : "text-public-ink"}`}
        aria-expanded={menuOpen}
        aria-controls="landing-mobile-menu"
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      {menuOpen ? (
        <>
        <button
          type="button"
          className="releva-menu-backdrop lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => onMenuOpenChange(false)}
        />
        <div
          id="landing-mobile-menu"
          className="releva-menu-sheet lg:hidden"
        >
          {landingCopy.nav.map((group) => (
            <div key={group.label} className="px-2 py-0.5">
              {group.links.length === 1 && group.links[0] ? (
                <Link
                  href={group.links[0].href}
                  className="flex min-h-11 items-center rounded-2xl px-2 text-sm font-medium hover:bg-public-sand"
                  onClick={() => onMenuOpenChange(false)}
                >
                  {group.label}
                </Link>
              ) : (
                <>
              <p className="px-2 pt-2 text-xs tracking-[0.16em] text-public-muted uppercase">{group.label}</p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-2xl px-2 text-sm hover:bg-public-sand"
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
            className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-medium hover:bg-public-sand"
            onClick={() => onMenuOpenChange(false)}
          >
            {landingCopy.waitlistNav.label}
          </Link>
          <Link
            href={accountHref}
            className={`${solidLink} mt-2 w-full`}
            onClick={() => onMenuOpenChange(false)}
          >
            {accountLabel}
          </Link>
        </div>
        </>
      ) : null}
      </div>
    </>
  );
}
