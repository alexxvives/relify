import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/landing/landing-nav";
import { Logo } from "@/components/logo";
import { landingCopy } from "@/lib/landing-copy";
import { getCurrentUser } from "@/server/getCurrentUser";

const quietLink =
  "hidden h-11 items-center rounded-full px-4 text-sm text-public-muted transition hover:text-public-ink md:inline-flex";
const solidLink =
  "inline-flex h-11 items-center rounded-full bg-public-clay px-4 text-sm text-white transition hover:bg-public-clay-deep";

export async function LandingHeader() {
  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <header className="sticky top-0 z-40 px-5 py-4 sm:px-8">
      <div className="releva-menu relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 rounded-full px-2 py-2 sm:px-4">
        <Link href="/" className="pl-2" aria-label="Releva">
          <Logo />
        </Link>
        <LandingNav />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/proyectos" className={quietLink}>
            {landingCopy.catalogCta}
          </Link>
          <Link href={user ? "/cuenta" : "/entrar"} className={solidLink}>
            {user ? landingCopy.accountCta : landingCopy.signInCta}
          </Link>
        </div>
      </div>
    </header>
  );
}
