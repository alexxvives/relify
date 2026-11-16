import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlatformTermsForm } from "@/components/auth/platform-terms-form";
import { SignerProvider } from "@/components/investor/signer-context";
import { PlatformTermsText } from "@/components/auth/platform-terms-text";
import { homeForRole } from "@/lib/auth-input";
import { platformTermsCopy } from "@/lib/platform-terms";
import { getCurrentUser } from "@/lib/server/get-current-user";

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
      <PlatformTermsText className="mt-8" />
      {/* S29: outside the (app) shell, so pass the signer here; otherwise the pad never asked for a missing DNI/NIE. */}
      <SignerProvider nationalIdMissing={user.nationalIdMissing} nationalIdMasked={user.nationalIdMasked}>
        <PlatformTermsForm />
      </SignerProvider>
    </main>
  );
}
