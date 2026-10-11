import { InvestorPublicCard } from "@/components/investor-public-card";
import type { PublicInvestorCard } from "@/lib/demo-profile";

export function FloatingInvestorCard({
  name,
  profile,
}: {
  name: string;
  profile: PublicInvestorCard | null;
}) {
  return <InvestorPublicCard label={name} profile={profile} />;
}
