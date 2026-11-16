import { ProfileSkeleton } from "@/components/shell/shell-skeleton";
import { investorCopy } from "@/lib/investor-copy";

export default function Loading() {
  return <ProfileSkeleton title={investorCopy.profileTitle} />;
}
