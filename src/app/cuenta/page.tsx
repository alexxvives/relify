import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { AppShell } from "@/components/app-shell";
import { authCopy } from "@/lib/auth-copy";
import { getAccountNationalId } from "@/server/getAccountNationalId";
import { getCurrentUser } from "@/server/getCurrentUser";

export const metadata: Metadata = {
  title: authCopy.accountTitle,
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const nationalId = await getAccountNationalId(user.id);

  return (
    <AppShell title={authCopy.accountTitle}>
      <AccountSettings name={user.name} lastName={user.lastName} email={user.email} phone={user.phone} nationalId={nationalId} />
    </AppShell>
  );
}
