import { MapPin } from "lucide-react";
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
              <ProfileFact label={sellerCopy.investorStakeLabel} value={profile.stake} wide />
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

const visibleSectors = 3;

function SectorChips({ label, value }: { label: string; value: string }) {
  const sectors = value
    .split(" · ")
    .map((sector) => sector.trim())
    .filter((sector) => sector.length > 0);
  const shown = sectors.slice(0, visibleSectors);
  const hidden = sectors.slice(visibleSectors);

  return (
    <div className="col-span-2 rounded-2xl bg-[#f7f8fb] px-3 py-3">
      <dt className="text-xs font-semibold text-[#667085]">{label}</dt>
      <dd className="mt-2 flex flex-wrap items-center gap-1.5">
        {sectors.length === 0 ? <span className="text-sm font-medium text-[#1c2740]">—</span> : null}
        {shown.map((sector) => (
          <span
            key={sector}
            title={sector}
            className="max-w-full truncate rounded-full border border-[#dfe4f5] bg-white px-2.5 py-1 text-xs font-medium text-[#1c2740]"
          >
            {sector}
          </span>
        ))}
        {hidden.length > 0 ? (
          <span className="group relative">
            <button
              type="button"
              aria-label={`${hidden.length} sectores más: ${hidden.join(", ")}`}
              className="rounded-full bg-[#3d34b8] px-2.5 py-1 text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#5c4de0]"
            >
              +{hidden.length}
            </button>
            <span
              role="tooltip"
              className="invisible absolute top-full left-0 z-20 mt-2 flex w-60 max-w-[70vw] flex-col gap-1 rounded-xl border border-[#e1e6ee] bg-white p-3 text-xs font-medium text-[#1c2740] opacity-0 shadow-[0_12px_32px_-12px_rgba(28,39,64,0.35)] transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
            >
              {hidden.map((sector) => (
                <span key={sector}>{sector}</span>
              ))}
            </span>
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function ProfileFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 rounded-2xl bg-[#f7f8fb] px-3 py-3" : "rounded-2xl bg-[#f7f8fb] px-3 py-3"}>
      <dt className="text-xs font-semibold text-[#667085]">{label}</dt>
      <dd className="mt-1 line-clamp-3 text-sm font-medium text-[#1c2740]">{value.length > 0 ? value : "—"}</dd>
    </div>
  );
}
