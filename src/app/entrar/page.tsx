import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { destinationForUser } from "@/lib/auth-input";
import { authCopy } from "@/lib/auth-copy";
import { safeReturnPath } from "@/lib/sign-in-return";
import { getCurrentUser } from "@/server/getCurrentUser";

export const metadata: Metadata = {
  title: authCopy.signInTitle,
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string }>;
}) {
  const query = await searchParams;
  const next = safeReturnPath(query.siguiente);
  const user = await getCurrentUser();

  if (user) {
    redirect(destinationForUser(user, next));
  }

  return <AuthScreen mode="sign-in" nextPath={next} />;
}
