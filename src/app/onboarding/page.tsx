import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { signOutAction } from "@/app/cuenta/actions";
import { OnboardingForm } from "@/components/onboarding-form";
import { Logo } from "@/components/logo";
import { authCopy } from "@/lib/auth-copy";
import { homeForRole, type SignupRole } from "@/lib/auth-input";
import { getCurrentUser } from "@/server/getCurrentUser";

export const metadata: Metadata = {
  title: authCopy.onboardingTitle,
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (user.onboarded) {
    redirect(homeForRole(user.role));
  }

  const jar = await cookies();
  const stored = jar.get("Relify-entry-role")?.value;
  const initialRole: SignupRole | "" =
    stored === "seller" || stored === "investor" || stored === "advisor" ? stored : "";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16">
      <Image src="/auth/login-background.jpg" alt="" fill priority unoptimized sizes="100vw" className="object-cover object-[54%_30%]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(22,50,79,0.28),rgba(20,153,138,0.22)_42%,rgba(22,50,79,0.55))]"
      />
      <form action={signOutAction} className="absolute top-6 left-6 z-20">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-[#16324f] shadow-sm hover:bg-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {authCopy.backHome}
        </button>
      </form>
      <section className="relative z-10 w-full max-w-5xl rounded-[28px] border border-white/70 bg-white/95 px-6 py-8 shadow-[0_24px_70px_-28px_rgba(22,50,79,0.55)] backdrop-blur-sm sm:px-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-[#14998a]">{authCopy.stageKicker}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#16324f]">{authCopy.onboardingTitle}</h1>
          </div>
          <Logo size="lg" />
        </div>
        <div className="mt-8">
          <OnboardingForm initialRole={initialRole} />
        </div>
      </section>
    </main>
  );
}
