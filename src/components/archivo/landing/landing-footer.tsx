import Link from "next/link";
import { landingCopy } from "@/lib/landing-copy";

export function LandingFooter() {
  return (
    <footer className="bg-[#f6f7f9] px-4 py-14">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="text-[26px] font-medium tracking-[-0.04em] text-[#243140]">
            Releva
          </Link>
          <p className="mt-2 max-w-xs text-sm text-[#5c6b78]">{landingCopy.footer.blurb}</p>
          <Link href="/entrar" className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#465ab4] px-4 text-sm text-white">
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
                    <Link href={link.href} className="text-sm text-[#5c6b78] hover:text-[#2b3b4a]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-[1200px] text-xs text-[#7b8792]">Releva {new Date().getFullYear()}</p>
    </footer>
  );
}
