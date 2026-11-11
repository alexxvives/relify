"use client";

import { useState } from "react";
import Link from "next/link";
import { ArcScope } from "@/components/arc/arc-scope";
import { SiteFooter } from "@/components/arc/blocks/site-footer/site-footer";
import { subscribeNewsletter } from "@/app/contacto/actions";
import { CookiePreferencesLink } from "@/components/cookie-consent";
import { Logo } from "@/components/logo";
import { landingCopy } from "@/lib/landing-copy";

export function LandingFooter() {
  return (
    <div className="px-5 pt-3 pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] sm:pt-4 sm:pb-[max(2.5rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))]">
      <div className="relify-footer mx-auto w-full max-w-[1440px] overflow-hidden rounded-[1.5rem] bg-public-card shadow-public sm:rounded-[2rem]">
        <CompactMobileFooter />
        <div className="hidden sm:block">
          <ArcScope>
            <SiteFooter
              variant="columns"
              brand={{ name: "Relify", href: "/", mark: <Logo /> }}
              tagline={landingCopy.footer.blurb}
              columns={landingCopy.footer.columns.map((column) => ({ title: column.title, links: column.links.map((link) => ({ ...link })) }))}
              legal={[]}
              socials={[]}
              status={null}
              newsletter={{
                title: "Una nota al mes del diario",
                description: "Guardamos solo tu email para avisarte de notas nuevas.",
                placeholder: "nombre@empresa.es",
                onSubscribe: (email) => subscribeNewsletter(email),
              }}
            />
          </ArcScope>
          <div className="border-t border-public-line px-6 py-3">
            <CookiePreferencesLink className="text-sm text-public-muted underline-offset-2 hover:underline" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactMobileFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const year = new Date().getFullYear();

  return (
    <div className="px-4 py-5 sm:hidden">
      <Link href="/" className="inline-flex items-center" aria-label="Relify">
        <Logo />
      </Link>
      <p className="mt-1 text-sm text-public-muted">{landingCopy.footer.blurb}</p>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
        {landingCopy.footer.columns.flatMap((column) =>
          column.links.map((link) => (
            <Link key={`${column.title}-${link.href}`} href={link.href} className="flex min-h-10 items-center text-sm text-public-ink">
              {link.label}
            </Link>
          )),
        )}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (status === "pending") {
            return;
          }
          setStatus("pending");
          void subscribeNewsletter(email)
            .then(() => setStatus("ok"))
            .catch(() => setStatus("error"));
        }}
      >
        <label className="sr-only" htmlFor="landing-footer-email">
          Correo para el diario
        </label>
        <input
          id="landing-footer-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nombre@empresa.es"
          className="relify-field h-10 min-w-0 flex-1 text-sm"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full bg-public-ink px-4 text-sm font-medium text-white"
        >
          {status === "pending" ? "…" : status === "ok" ? "Listo" : "Enviar"}
        </button>
      </form>
      {status === "error" ? <p className="mt-1 text-xs text-public-muted">No se ha podido guardar. Inténtalo de nuevo.</p> : null}
      <p className="mt-4 text-xs text-public-muted">
        © {year} Relify · <CookiePreferencesLink className="text-xs text-public-muted underline-offset-2 hover:underline" />
      </p>
    </div>
  );
}
