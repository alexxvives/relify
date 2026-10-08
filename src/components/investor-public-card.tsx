import type { ReactNode } from "react";
import type { PublicInvestorCard } from "@/lib/demo-profile";
import { sellerCopy } from "@/lib/seller-copy";

export function InvestorPublicCard({
  label,
  profile,
  footer = null,
}: {
  label: string;
  profile: PublicInvestorCard | null;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#e7eaee] bg-white text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.35)]">
      <div className="bg-[#1c2740] px-6 pt-5 pb-14">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">Perfil del inversor</p>
      </div>
      <div className="-mt-10 px-6 pb-6">
        <ProfilePhoto photo={profile?.photo ?? ""} />
        <h2 className="mt-3 text-xl font-semibold">{label}</h2>
        {profile?.place ? <p className="mt-1 text-sm text-[#5c6b78]">{profile.place}</p> : null}
        {profile ? (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <ProfileFact label={sellerCopy.investorTypeLabel} value={profile.investorType} />
              <ProfileFact label={sellerCopy.investorTicketLabel} value={profile.ticket} />
              <ProfileFact label={sellerCopy.investorSectorsLabel} value={profile.sectors} />
              <ProfileFact label={sellerCopy.investorPlaceLabel} value={profile.place} />
            </dl>
            <p className="mt-5 text-xs font-semibold tracking-wide text-[#667085] uppercase">{sellerCopy.investorThesisLabel}</p>
            <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{profile.thesis}</p>
            <p className="mt-4 text-xs font-semibold tracking-wide text-[#667085] uppercase">{sellerCopy.investorOfferLabel}</p>
            <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{profile.contribution}</p>
          </>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#667085]">{sellerCopy.investorProfileEmpty}</p>
        )}
        {footer}
      </div>
    </div>
  );
}

function ProfilePhoto({ photo }: { photo: string }) {
  if (photo.length === 0) {
    return (
      <span className="inline-flex size-20 items-center justify-center rounded-full border-4 border-white bg-[#e7edf8] text-sm font-semibold text-[#1c2740]">
        I
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" className="size-20 rounded-full border-4 border-white object-cover" />
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f8fb] px-3 py-3">
      <dt className="text-[11px] font-semibold tracking-wide text-[#667085] uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1c2740]">{value.length > 0 ? value : "—"}</dd>
    </div>
  );
}
