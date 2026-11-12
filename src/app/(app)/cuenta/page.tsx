import { Suspense } from "react";
import { AccountSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { regenerateTeaserLinkAction } from "@/app/(app)/mi-empresa/actions";
import { AccountSettings } from "@/components/account-settings";
import { SellerPdfCard } from "@/components/company-pdf-card";
import { SignedPlatformTerms } from "@/components/signed-platform-terms";
import { SignedInPage } from "@/components/signed-in-page";
import { InvestorAccount } from "@/components/investor-account";
import { authCopy } from "@/lib/auth-copy";
import { demoInvestorProfile } from "@/lib/demo-profile";
import { getAccountNationalId } from "@/server/getAccountNationalId";
import { sellerTeaserDesk } from "@/server/companyPdfs";
import { getCurrentUser } from "@/server/getCurrentUser";
import {
  investorGazeAvatar,
  loadInvestorDraft,
} from "@/server/investorProfile";

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

  const nationalId = await getAccountNationalId(user.id);
  const investorDraft =
    user.role === "investor"
      ? await loadInvestorDraft(user.id, user.email)
      : null;
  const teaserDesk = user.role === "seller" ? await sellerTeaserDesk(user.id) : null;

  const agreement = user.termsAcceptedAt ? (
    <SignedPlatformTerms userId={user.id} acceptedAt={user.termsAcceptedAt} />
  ) : null;
  const teaser =
    teaserDesk ? (
      <SellerPdfCard
        desk={teaserDesk}
        previewHref="/mi-empresa/pdf/teaser?preview=1"
        downloadHref="/mi-empresa/pdf/teaser?download=1"
        onRegenerate={regenerateTeaserLinkAction}
      />
    ) : null;

  return (
    <>
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
          middle={teaser}
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
