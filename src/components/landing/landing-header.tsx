import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/landing/landing-nav";
import { landingCopy } from "@/lib/landing-copy";
import { getCurrentUser } from "@/server/getCurrentUser";

const quietLink =
  "hidden h-11 items-center rounded-full px-4 text-sm text-public-muted transition hover:text-public-ink md:inline-flex";
const solidLink =
  "inline-flex h-11 items-center rounded-full bg-public-clay px-4 text-sm text-white transition hover:bg-public-clay-deep";

export async function LandingHeader({ archive = false }: { archive?: boolean }) {
  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <header className="sticky top-0 z-40 px-4 py-4">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full bg-public-card px-2 py-2 shadow-public sm:px-4">
        <Link href="/" className="pl-3 text-lg font-medium tracking-tight">
          Releva
        </Link>
        <LandingNav />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/proyectos" className={quietLink}>
            {landingCopy.catalogCta}
          </Link>
          <Link href={user ? "/cuenta" : "/entrar"} className={solidLink}>
            {user ? landingCopy.accountCta : landingCopy.signInCta}
          </Link>
          {archive ? (
            <Link
              href="/archivo"
              className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm text-[#f9fafb]"
            >
              Archivo
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
