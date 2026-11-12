import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { signOutAction } from "@/app/(app)/cuenta/actions";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { OnboardingPlanResume } from "@/components/auth/onboarding-plan-resume";
import { loadBuyerPlan } from "@/lib/server/buyer-plan";
import { IntBadge } from "@/components/shell/int-badge";
import { Logo } from "@/components/shell/logo";
import { isIntEnvironment } from "@/lib/int-env";
import { authCopy } from "@/lib/auth-copy";
import { homeForRole, type SignupRole } from "@/lib/auth-input";
import { ConversionPing } from "@/components/auth/cookie-consent";
import { getCurrentUser } from "@/lib/server/get-current-user";

export const metadata: Metadata = {
  title: authCopy.onboardingTitle,
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ paso?: string }> }) {
  const user = await getCurrentUser();
  const { paso } = await searchParams;

  if (!user) {
    redirect("/entrar");
  }

  // Backing out of Stripe during signup lands here: resume at the Plan step while no plan is active.
  const resumePlan =
    user.onboarded &&
    paso === "plan" &&
    user.role === "investor" &&
    (await loadBuyerPlan(user.id)).plan === "none";

  if (user.onboarded && !resumePlan) {
    redirect(homeForRole(user.role));
  }

  const jar = await cookies();
  const stored = jar.get("Relify-entry-role")?.value;
  const initialRole: SignupRole | "" =
    stored === "seller" || stored === "investor" || stored === "advisor" ? stored : "";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-y-auto px-4 py-16 pt-[max(4.5rem,calc(3rem+env(safe-area-inset-top,0px)))] pb-[max(2rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))]">
      <Image src="/auth/login-background.jpg" alt="" fill priority unoptimized sizes="100vw" className="object-cover object-[54%_30%]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(22,50,79,0.28),rgba(20,153,138,0.22)_42%,rgba(22,50,79,0.55))]"
      />
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
        {isIntEnvironment() ? <IntBadge /> : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-[#16324f] shadow-sm hover:bg-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {authCopy.backHome}
          </button>
        </form>
      </div>
      <section className="relative z-10 w-full max-w-5xl rounded-[28px] border border-white/70 bg-white/95 px-6 py-8 shadow-[0_24px_70px_-28px_rgba(22,50,79,0.55)] backdrop-blur-sm sm:px-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-[#14998a]">{authCopy.stageKicker}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#16324f]">{authCopy.onboardingTitle}</h1>
          </div>
          <Logo size="lg" />
        </div>
        <ConversionPing event="sign_up" />
        <div className="mt-8">
          {resumePlan ? <OnboardingPlanResume home={homeForRole(user.role)} /> : <OnboardingForm initialRole={initialRole} />}
        </div>
      </section>
    </main>
  );
}
