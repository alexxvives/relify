import type { ReactNode } from "react";
import type { PublicInvestorCard } from "@/lib/demo-profile";
import { sellerCopy } from "@/lib/seller-copy";

export function InvestorPublicCard({
  label,
  profile,
  footer = null,
  interest = null,
}: {
  label: string;
  profile: PublicInvestorCard | null;
  footer?: ReactNode;
  interest?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#e7eaee] bg-white text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.35)]">
      <div className="bg-[#1c2740] px-6 pt-5 pb-14">
        <p className="text-xs font-semibold text-white/70">Perfil del inversor</p>
        {interest ? (
          <p className="mt-2 text-sm text-white">
            Interesado en <span className="font-semibold">{interest}</span>
          </p>
        ) : null}
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
              <ProfileFact label={sellerCopy.investorStakeLabel} value={profile.stake} />
            </dl>
            <ProfileNote label={sellerCopy.investorOfferLabel} value={profile.contribution} />
            <ProfileNote label={sellerCopy.investorThesisLabel} value={profile.thesis} />
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
    <img src={photo} alt="" className="size-20 rounded-full border-4 border-white bg-[#1c2740] object-cover" />
  );
}

function ProfileNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold text-[#667085]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{value.length > 0 ? value : "—"}</p>
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f8fb] px-3 py-3">
      <dt className="text-xs font-semibold text-[#667085]">{label}</dt>
      <dd className="mt-1 line-clamp-3 text-sm font-medium text-[#1c2740]">{value.length > 0 ? value : "—"}</dd>
    </div>
  );
}
