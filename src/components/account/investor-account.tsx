"use client";

import { useState, type ReactNode } from "react";
import { AccountSettings } from "@/components/account/account-settings";
import { InvestorPhotoDrop, InvestorProfile } from "@/components/investor/investor-profile";
import type { DemoInvestorProfile, InvestorProfileDraft } from "@/lib/demo-profile";
import { investorCopy } from "@/lib/investor-copy";

export function InvestorAccount({
  name,
  lastName,
  email,
  phone,
  nationalIdMasked,
  displayName,
  initial,
  draft,
  avatarUrl,
  agreement = null,
}: {
  name: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  nationalIdMasked: string | null;
  displayName: string;
  initial: DemoInvestorProfile | null;
  draft: InvestorProfileDraft;
  avatarUrl: string;
  agreement?: ReactNode;
}) {
  const [photo, setPhoto] = useState(draft.photo);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const photoSlot: ReactNode = (
    <InvestorPhotoDrop
      photo={photo}
      fallback={avatarUrl}
      message={photoMessage}
      onReady={(next) => {
        setPhoto(next);
        setPhotoMessage(null);
      }}
      onHeavy={() => {
        setPhotoMessage(investorCopy.photoHeavy);
      }}
    />
  );

  return (
    <AccountSettings
      name={name}
      lastName={lastName}
      email={email}
      phone={phone}
      nationalIdMasked={nationalIdMasked}
      photo={photoSlot}
      middle={
        <InvestorProfile
          displayName={displayName}
          initial={initial}
          draft={draft}
          avatarUrl={avatarUrl}
          publicOnly
          photoValue={photo}
          onPhotoChange={setPhoto}
          hidePhotoControl
        />
      }
      agreement={agreement}
    />
  );
}
