import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { destinationForUser } from "@/lib/auth-input";
import { authCopy } from "@/lib/auth-copy";
import { getCurrentUser } from "@/server/getCurrentUser";

export const metadata: Metadata = {
  title: authCopy.signUpTitle,
  robots: { index: false, follow: false },
};

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(destinationForUser(user));
  }

  return <AuthScreen mode="sign-up" />;
}
