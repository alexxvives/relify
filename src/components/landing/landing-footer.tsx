import Link from "next/link";
import { Logo } from "@/components/logo";
import { landingCopy } from "@/lib/landing-copy";

export function LandingFooter() {
  return (
    <footer className="px-5 pt-4 pb-10">
      <div className="mx-auto w-full max-w-[1440px] rounded-[2rem] bg-public-card px-8 py-12 shadow-public sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.1fr_2fr]">
          <div>
            <Link href="/" aria-label="Relify">
              <Logo />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-public-muted">{landingCopy.footer.blurb}</p>
            <Link
              href="/entrar"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-public-clay px-4 text-sm text-white hover:bg-public-clay-deep"
            >
              {landingCopy.signInCta}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
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
        <p suppressHydrationWarning className="mt-12 border-t border-public-line pt-4 text-xs text-public-muted">
          Relify {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
