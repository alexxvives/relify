import { NoteSkeleton } from "@/components/shell-skeleton";
import { investorCopy } from "@/lib/investor-copy";

export default function Loading() {
  return <NoteSkeleton title={investorCopy.hiddenTitle} />;
}
