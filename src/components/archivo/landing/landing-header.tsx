import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/archivo/landing/landing-nav";
import { landingCopy } from "@/lib/landing-copy";
import { getCurrentUser } from "@/server/getCurrentUser";

const outlineLink =
  "hidden h-11 items-center rounded-2xl border border-[#d5dbe3] bg-white px-4 text-[15px] text-[#2b3b4a] transition hover:bg-[#f7f8fa] md:inline-flex";
const solidLink =
  "inline-flex h-11 items-center rounded-2xl bg-[#465ab4] px-4 text-[15px] text-[#f9fafb] transition hover:bg-[#3c4e9e]";

export async function LandingHeader() {
  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="text-[26px] font-medium tracking-[-0.04em] text-[#243140]">
          Relify
          <span className="ml-0.5 inline-block size-1.5 translate-y-[-10px] rounded-full bg-[#e2a33a]" aria-hidden="true" />
        </Link>
        <LandingNav />
        <div className="flex items-center gap-2">
          <Link href="/proyectos" className={outlineLink}>
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
