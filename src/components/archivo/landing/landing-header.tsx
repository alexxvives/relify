import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/archivo/landing/landing-nav";
import { landingCopy } from "@/lib/landing-copy";
import { getCurrentUser } from "@/server/getCurrentUser";

export async function LandingHeader() {
  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="relative mx-auto flex max-w-[1440px] items-center px-5 py-4">
        <Link href="/" className="shrink-0 text-[26px] font-medium tracking-[-0.04em] text-[#243140]">
          Relify
          <span className="ml-0.5 inline-block size-1.5 translate-y-[-10px] rounded-full bg-[#e2a33a]" aria-hidden="true" />
        </Link>
        <LandingNav
          accountHref={user ? "/cuenta" : "/entrar"}
          accountLabel={user ? landingCopy.accountCta : landingCopy.signInCta}
        />
      </div>
    </header>
  );
}
