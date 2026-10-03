import Link from "next/link";
import { landingCopy } from "@/lib/landing-copy";

export function LandingFooter() {
  return (
    <footer className="px-5 pt-4 pb-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-public-card px-8 py-12 shadow-public">
        <div className="grid gap-10 md:grid-cols-[1.1fr_2fr]">
          <div>
            <Link href="/" className="text-lg font-medium tracking-tight">
              Releva
            </Link>
            <p className="mt-3 max-w-xs text-sm text-public-muted">{landingCopy.footer.blurb}</p>
            <Link
              href="/entrar"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-public-clay px-4 text-sm text-white hover:bg-public-clay-deep"
            >
              {landingCopy.signInCta}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {landingCopy.footer.columns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-medium">{column.title}</p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-public-muted hover:text-public-ink">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-12 border-t border-public-line pt-4 text-xs text-public-muted">Releva {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
