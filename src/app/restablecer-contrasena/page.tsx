import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import { authCopy } from "@/lib/auth-copy";

export const metadata: Metadata = {
  title: authCopy.resetCardTitle,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthScreen mode="reset" token={typeof token === "string" ? token : null} />
  );
}
