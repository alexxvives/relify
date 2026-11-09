"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { landingCopy } from "@/lib/landing-copy";

export function LandingNav({
  accountHref,
  accountLabel,
}: {
  accountHref: string;
  accountLabel: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  return (
    <div className="relative ml-auto flex items-center gap-2">
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones" onMouseLeave={() => setOpen(null)}>
        {landingCopy.nav.map((group) => (
          <div key={group.label} className="relative" onMouseEnter={() => setOpen(group.label)}>
            <button
              type="button"
              className="flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-[15px] text-[#2b3b4a] hover:bg-[#f4f6f8]"
              aria-expanded={open === group.label}
            >
              {group.label}
              <ChevronDown className={`size-4 transition ${open === group.label ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <div
              className={`absolute top-full left-0 z-50 min-w-56 pt-2 transition ${open === group.label ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
            >
              <div className="rounded-2xl bg-white p-2 shadow-[0_16px_40px_-20px_rgba(43,59,74,0.45)] ring-1 ring-black/5">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-[#f4f6fb]">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </nav>
      <Link
        href="/proyectos"
        className="hidden h-11 items-center rounded-2xl border border-[#d5dbe3] bg-white px-4 text-[15px] text-[#2b3b4a] transition hover:bg-[#f7f8fa] lg:inline-flex"
      >
        {landingCopy.catalogCta}
      </Link>
      <Link
        href={accountHref}
        className="hidden h-11 items-center rounded-2xl bg-[#465ab4] px-4 text-[15px] text-[#f9fafb] transition hover:bg-[#3c4e9e] lg:inline-flex"
      >
        {accountLabel}
      </Link>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-2xl border border-[#d5dbe3] lg:hidden"
        aria-expanded={mobile}
        aria-controls="archivo-mobile-menu"
        aria-label={mobile ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setMobile((current) => !current)}
      >
        {mobile ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      {mobile ? (
        <div
          id="archivo-mobile-menu"
          className="absolute top-full right-0 z-50 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 lg:hidden"
        >
          {landingCopy.nav.map((group) => (
            <div key={group.label} className="py-1">
              <p className="px-3 py-1 text-xs font-medium tracking-wide text-[#7b8792] uppercase">{group.label}</p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-[#f4f6fb]"
                  onClick={() => setMobile(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href="/proyectos"
            className="mt-1 flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-[#f4f6fb]"
            onClick={() => setMobile(false)}
          >
            {landingCopy.catalogCta}
          </Link>
          <Link
            href={accountHref}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#465ab4] px-4 text-[15px] text-[#f9fafb]"
            onClick={() => setMobile(false)}
          >
            {accountLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
