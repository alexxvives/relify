"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { landingCopy } from "@/lib/landing-copy";

export function LandingNav() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones" onMouseLeave={() => setOpen(null)}>
        {landingCopy.nav.map((group) => (
          <div key={group.label} className="relative" onMouseEnter={() => setOpen(group.label)}>
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-3 py-2 text-[15px] text-public-muted hover:text-public-ink"
              aria-expanded={open === group.label}
            >
              {group.label}
              <ChevronDown className={`size-4 transition ${open === group.label ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <div
              className={`absolute top-full left-0 z-50 min-w-56 pt-3 transition ${open === group.label ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
            >
              <div className="rounded-3xl bg-public-card p-2 text-public-ink shadow-public">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded-2xl px-4 py-2.5 text-sm hover:bg-public-sand">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
        <Link
          href={landingCopy.waitlistNav.href}
          className="rounded-full px-3 py-2 text-[15px] text-public-ink hover:bg-public-sand"
        >
          {landingCopy.waitlistNav.label}
        </Link>
      </nav>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full text-public-ink lg:hidden"
        aria-expanded={mobile}
        aria-label={mobile ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setMobile((current) => !current)}
      >
        {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {mobile ? (
        <div className="absolute inset-x-0 top-full z-50 mt-3 rounded-[1.5rem] bg-public-card p-3 text-public-ink shadow-public lg:hidden">
          {landingCopy.nav.map((group) => (
            <div key={group.label} className="px-2 py-2">
              <p className="text-xs tracking-[0.16em] text-public-muted uppercase">{group.label}</p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-2xl py-2 text-sm hover:bg-public-sand"
                  onClick={() => setMobile(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href={landingCopy.waitlistNav.href}
            className="block rounded-2xl px-2 py-3 text-sm font-medium hover:bg-public-sand"
            onClick={() => setMobile(false)}
          >
            {landingCopy.waitlistNav.label}
          </Link>
          <Link
            href="/proyectos"
            className="block rounded-2xl px-2 py-3 text-sm hover:bg-public-sand"
            onClick={() => setMobile(false)}
          >
            {landingCopy.catalogCta}
          </Link>
        </div>
      ) : null}
    </>
  );
}
