import { Suspense } from "react";
import { AccountSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account/account-settings";
import { SignedPlatformTerms } from "@/components/auth/signed-platform-terms";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { InvestorAccount } from "@/components/account/investor-account";
import { authCopy } from "@/lib/auth-copy";
import { maskNationalId } from "@/lib/spanish-cif";
import { demoInvestorProfile } from "@/lib/demo-profile";
import { getAccountNationalId } from "@/lib/server/get-account-national-id";
import { getCurrentUser } from "@/lib/server/get-current-user";
import {
  investorGazeAvatar,
  loadInvestorDraft,
} from "@/lib/server/investor-profile";

export const metadata: Metadata = {
  title: authCopy.accountTitle,
  robots: { index: false, follow: false },
};

async function AccountPageContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const storedNationalId = await getAccountNationalId(user.id);
  const nationalIdMasked = storedNationalId ? maskNationalId(storedNationalId) : null;
  const investorDraft =
    user.role === "investor"
      ? await loadInvestorDraft(user.id, user.email)
      : null;
  const agreement = user.termsAcceptedAt ? (
    <SignedPlatformTerms userId={user.id} acceptedAt={user.termsAcceptedAt} />
  ) : null;

  return (
    <>
      {investorDraft ? (
        <InvestorAccount
          name={user.name}
          lastName={user.lastName}
          email={user.email}
          phone={user.phone}
          nationalIdMasked={nationalIdMasked}
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
          nationalIdMasked={nationalIdMasked}
          agreement={agreement}
        />
      )}
    </>
  );
}

export default async function AccountPage() {
  // Session lookup is request-cached; it only picks which skeleton (buyers get the profile card).
  const role = (await getCurrentUser())?.role;
  return (
    <SignedInPage title={authCopy.accountTitle}>
      <Suspense fallback={<AccountSkeleton buyer={role === "investor"} />}>
        <AccountPageContent />
      </Suspense>
    </SignedInPage>
  );
}
