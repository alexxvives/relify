import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { SignedPlatformTerms } from "@/components/signed-platform-terms";
import { AppShell } from "@/components/app-shell";
import { InvestorAccount } from "@/components/investor-account";
import { authCopy } from "@/lib/auth-copy";
import { demoInvestorProfile } from "@/lib/demo-profile";
import { getAccountNationalId } from "@/server/getAccountNationalId";
import { getCurrentUser } from "@/server/getCurrentUser";
import { investorGazeAvatar, loadInvestorDraft } from "@/server/investorProfile";

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
  const investorDraft = user.role === "investor" ? await loadInvestorDraft(user.id, user.email) : null;

  const agreement = user.termsAcceptedAt ? (
    <SignedPlatformTerms userId={user.id} acceptedAt={user.termsAcceptedAt} />
  ) : null;

  return (
    <AppShell title={authCopy.accountTitle}>
      {investorDraft ? (
        <InvestorAccount
          name={user.name}
          lastName={user.lastName}
          email={user.email}
          phone={user.phone}
          nationalId={nationalId}
          displayName={user.displayName}
          initial={demoInvestorProfile(user.email)}
          draft={investorDraft}
          avatarUrl={investorGazeAvatar(user.id)}
          agreement={agreement}
        />
      ) : (
        <AccountSettings
          name={user.name}
          lastName={user.lastName}
          email={user.email}
          phone={user.phone}
          nationalId={nationalId}
          agreement={agreement}
        />
      )}
    </AppShell>
  );
}
