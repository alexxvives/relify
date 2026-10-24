import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlatformTermsForm } from "@/components/platform-terms-form";
import { homeForRole } from "@/lib/auth-input";
import { platformTermsCopy } from "@/lib/platform-terms";
import { getCurrentUser } from "@/server/getCurrentUser";

export const metadata: Metadata = {
  title: platformTermsCopy.title,
  robots: { index: false, follow: false },
};

export default async function PlatformTermsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  if (user.termsAccepted || user.role === "admin") {
    redirect(homeForRole(user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-[#1c2740]">{platformTermsCopy.title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#5c6b78]">{platformTermsCopy.intro}</p>
      <div className="mt-8 flex flex-col gap-4 text-sm leading-6 text-[#1c2740]">
        {platformTermsCopy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <PlatformTermsForm />
    </main>
  );
}
