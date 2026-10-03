import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { catalogCopy } from "@/lib/catalog-copy";

export function CatalogHeader() {
  return (
    <header className="border-b border-public-ink bg-public-ink font-public text-public-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="inline-flex items-baseline gap-2 text-[1.7rem] leading-none tracking-tight">
          <span className="inline-block size-2.5 bg-public-clay" aria-hidden="true" />
          Releva
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm">
          <Link href="/proyectos" className="hover:text-public-clay">
            {catalogCopy.navProjects}
          </Link>
          <AccountNav />
        </nav>
      </div>
    </header>
  );
}
