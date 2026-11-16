import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { destinationForUser } from "@/lib/auth-input";
import { authCopy } from "@/lib/auth-copy";
import { getCurrentUser } from "@/lib/server/get-current-user";

export const metadata: Metadata = {
  title: authCopy.signUpTitle,
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect(destinationForUser(user));
  }

  const query = await searchParams;
  const intent =
    query.rol === "empresa"
      ? "seller"
      : query.rol === "inversor"
        ? "investor"
        : query.rol === "asesor"
          ? "advisor"
          : null;

  return <AuthScreen mode="sign-up" intent={intent} />;
}
