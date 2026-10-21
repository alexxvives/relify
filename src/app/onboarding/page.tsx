import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
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
  const stored = jar.get("releva-entry-role")?.value;
  const initialRole: SignupRole | "" =
    stored === "seller" || stored === "investor" || stored === "advisor" ? stored : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
      <section className="w-full max-w-5xl rounded-[28px] border border-[#e6eaf2] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(28,39,64,0.06)] sm:px-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1c2740]">{authCopy.onboardingTitle}</h1>
            <p className="mt-2 text-sm text-[#5c6b78]">{authCopy.onboardingIntro}</p>
          </div>
          <p className="text-xl font-semibold tracking-tight text-[#24324a]">Releva</p>
        </div>
        <div className="mt-8">
          <OnboardingForm initialRole={initialRole} />
        </div>
      </section>
    </main>
  );
}
