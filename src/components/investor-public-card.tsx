import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { PublicInvestorCard } from "@/lib/demo-profile";
import { sellerCopy } from "@/lib/seller-copy";
import { SectorMarquee } from "@/components/sector-marquee";

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
    <div className="overflow-hidden rounded-2xl border border-[#e7eaee] bg-white text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.35)]">
      <div className="relative bg-[#1c2740] px-6 pt-5 pb-14">
        <h2 className="truncate text-xl font-semibold text-white">{label}</h2>
        {profile?.place ? (
          <p className="absolute right-6 bottom-3 max-w-[62%] text-right text-sm leading-tight text-white/80">
            <MapPin className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
            {profile.place}
          </p>
        ) : null}
        {interest ? (
          <p className="mt-2 text-sm text-white">
            Interesado en <span className="font-semibold">{interest}</span>
          </p>
        ) : null}
      </div>
      <div className="relative -mt-10 px-6 pb-6">
        <ProfilePhoto photo={profile?.photo ?? ""} />
        {profile ? (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <ProfileFact label={sellerCopy.investorTypeLabel} value={profile.investorType} />
              <ProfileFact label={sellerCopy.investorTicketLabel} value={profile.ticket} />
              <ProfileFact label={sellerCopy.investorStakeLabel} value={profile.stake} />
              <SectorChips label={sellerCopy.investorSectorsLabel} value={profile.sectors} />
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

function SectorChips({ label, value }: { label: string; value: string }) {
  const sectors = value
    .split(" · ")
    .map((sector) => sector.trim())
    .filter((sector) => sector.length > 0);

  return (
    <div className="min-w-0 rounded-2xl bg-[#f7f8fb] px-3 py-3">
      <dt className="text-xs font-semibold break-normal hyphens-auto text-[#667085]">{label}</dt>
      <dd className="mt-1.5 min-w-0">
        {sectors.length === 0 ? <span className="text-sm font-medium text-[#1c2740]">—</span> : <SectorMarquee sectors={sectors} />}
      </dd>
    </div>
  );
}

function ProfileFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 rounded-2xl bg-[#f7f8fb] px-3 py-3" : "rounded-2xl bg-[#f7f8fb] px-3 py-3"}>
      <dt className="text-xs font-semibold break-normal hyphens-auto text-[#667085]">{label}</dt>
      <dd className="mt-1 line-clamp-3 text-sm font-medium text-[#1c2740]">{value.length > 0 ? value : "—"}</dd>
    </div>
  );
}
