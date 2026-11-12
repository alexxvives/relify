import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import { authCopy } from "@/lib/auth-copy";

export const metadata: Metadata = {
  title: authCopy.forgotCardTitle,
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <AuthScreen mode="forgot" />;
}
